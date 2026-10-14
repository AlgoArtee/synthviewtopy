"""Run the asset generator through the official Blender MCP stdio server.

Uses the MCP Python SDK and the unmodified Blender Lab server. Its isolated
Blender bridge listens on loopback port 9877, preserving the user's UI session.
"""
import argparse
import asyncio
from datetime import timedelta
import json
import os
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true')
    parser.add_argument('--render-views', default='all')
    parser.add_argument('--render-angle', choices=['01-front', '02-left-profile', '03-left-three-quarter', '04-right-three-quarter'])
    parser.add_argument('--code-file', type=Path)
    args = parser.parse_args()
    env = dict(os.environ)
    env['BLENDER_MCP_HOST'] = '127.0.0.1'
    env['BLENDER_MCP_PORT'] = '9877'
    env['BLENDER_PATH'] = r'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe'
    server = StdioServerParameters(
        command=str(ROOT / '.runtime/blender-mcp-python/Scripts/blender-mcp.exe'),
        env=env,
    )
    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write, read_timeout_seconds=timedelta(minutes=15)) as session:
            info = await session.initialize()
            tool_list = await session.list_tools()
            print(json.dumps({'server': info.serverInfo.model_dump(),
                              'tools': [tool.name for tool in tool_list.tools]}), flush=True)
            if args.generate:
                code = ('import bpy, os, runpy\n'
                        f'os.environ["ASTRODESK_RENDER_VIEWS"] = {args.render_views!r}\n'
                        f'runpy.run_path({str(HERE / "create_astronomy_desk.py")!r}, run_name="__main__")\n'
                        f'result = {{"generated": True, "file": {str(HERE / "liminette-astronomy-desk.blend")!r}}}')
            elif args.render_angle:
                code = ('import runpy\n'
                        f'result = runpy.run_path({str(HERE / "render_reference_angle.py")!r}, '
                        f'init_globals={{"ANGLE_NAME": {args.render_angle!r}}})["result"]')
            elif args.code_file:
                code = args.code_file.read_text(encoding='utf-8')
            else:
                code = 'import bpy\nresult = {"version": bpy.app.version_string, "background": bpy.app.background, "scene": bpy.context.scene.name}'
            reply = await session.call_tool('execute_blender_code', {'code': code}, read_timeout_seconds=timedelta(minutes=15))
            serializable = reply.model_dump(mode='json')
            evidence = ROOT / 'test-artifacts/liminette-astronomy-desk'
            evidence.mkdir(parents=True, exist_ok=True)
            evidence_name = 'mcp-generation' if args.generate else ('mcp-' + args.render_angle if args.render_angle else ('mcp-execution' if args.code_file else 'mcp-connection'))
            (evidence / (evidence_name + '.json')).write_text(
                json.dumps(serializable, indent=2) + '\n', encoding='utf-8')
            failed = reply.isError
            for block in reply.content:
                if block.type != 'text':
                    continue
                try:
                    payload = json.loads(block.text)
                except json.JSONDecodeError:
                    print(block.text[:2000], flush=True)
                    continue
                failed = failed or payload.get('status') == 'error'
                print(json.dumps({key: value for key, value in payload.items() if key not in ('stdout', 'stderr')}), flush=True)
                if failed:
                    print(payload.get('stderr', '')[-2500:], flush=True)
                    print(payload.get('stdout', '')[-1500:], flush=True)
            if failed:
                raise RuntimeError('Official Blender MCP execution failed; see saved evidence')


if __name__ == '__main__':
    asyncio.run(main())
