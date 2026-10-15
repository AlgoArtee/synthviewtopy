import * as THREE from 'three';
import { CityRoundedBoxGeometry } from './osCityGeometry';

/** Full-height refrigerator at the south end of the east-wall kitchen; front faces -X. */
export function createOsCityFridge() {
  const group = new THREE.Group();
  group.name = 'Kitchen · tall pearl refrigerator';
  group.position.set(4.38, 0, 4.86);
  const enamel = new THREE.MeshPhysicalMaterial({color:'#e4e8eb',roughness:.32,metalness:.12,clearcoat:.28});
  const doorEnamel = new THREE.MeshPhysicalMaterial({color:'#eef0f1',roughness:.28,metalness:.08,clearcoat:.32});
  const graphite = new THREE.MeshStandardMaterial({color:'#263340',roughness:.58});
  const aluminium = new THREE.MeshStandardMaterial({color:'#bac8d2',roughness:.26,metalness:.92});
  const box = (name:string,dimensions:number[],position:number[],material:THREE.Material,radius=.01) => {
    const mesh = new THREE.Mesh(new CityRoundedBoxGeometry(dimensions[0],dimensions[1],dimensions[2],2,radius),material);
    mesh.name = 'Fridge · '+name;mesh.position.set(position[0],position[1],position[2]);
    mesh.castShadow = mesh.receiveShadow = true;group.add(mesh);return mesh;
  };
  box('insulated cabinet',[.74,2.10,.72],[0,1.13,0],enamel,.028);
  box('recessed foot plinth',[.63,.13,.61],[.035,.105,0],graphite,.012);
  for(const x of [-.27,.27])for(const z of [-.26,.26])
    box('levelling foot',[.065,.08,.065],[x,.04,z],graphite,.01);
  // Separate gaskets and softly radiused doors make the freezer division readable.
  for(const [label,y,height] of [['refrigerator',1.479,1.338],['freezer',.468,.602]] as const) {
    box(label+' door seal',[.018,height+.016,.678],[-.374,y,0],graphite,.009);
    box(label+' door',[.06,height,.684],[-.409,y,0],doorEnamel,.022);
  }
  for(const [label,y,length] of [['refrigerator',1.23,.56],['freezer',.477,.30]] as const) {
    for(const offset of [-length/2+.035,length/2-.035])
      box(label+' handle standoff',[.043,.026,.026],[-.454,y+offset,-.245],aluminium,.008);
    box(label+' vertical handle',[.027,length,.029],[-.479,y,-.245],aluminium,.012);
  }
  box('vent surround',[.018,.075,.57],[-.342,.112,0],aluminium,.006);
  for(let i=0;i<4;i++)box('toe ventilation slot',[.004,.006,.51],[-.353,.087+i*.016,0],graphite,.002);
  const canvas = document.createElement('canvas');canvas.width=384;canvas.height=224;
  const c = canvas.getContext('2d')!;
  c.fillStyle='#101f2b';c.fillRect(0,0,384,224);
  c.strokeStyle='#52778b';c.lineWidth=3;c.strokeRect(5,5,374,214);
  c.textAlign='center';c.fillStyle='#b7f2ff';c.font='22px monospace';c.fillText('CLIMATE CONTROL',192,38);
  c.font='54px monospace';c.fillText('4°C  −18°C',192,111);
  c.fillStyle='#6facbc';c.font='18px monospace';c.fillText('FRIDGE     FREEZER',192,148);
  c.fillStyle='#98dbe9';c.fillRect(66,183,252,3);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  box('temperature panel bezel',[.008,.134,.232],[-.441,1.82,0],graphite,.008);
  const display=new THREE.Mesh(new THREE.PlaneGeometry(.214,.124),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
  display.name='Fridge · temperature display';display.position.set(-.446,1.82,0);display.rotation.y=-Math.PI/2;group.add(display);
  box('brushed maker badge',[.006,.012,.073],[-.442,2.055,0],aluminium,.003);
  group.userData.appliance={height:2.18,front:'-X',type:'refrigerator with lower freezer',position:group.position.toArray()};
  // Include protruding handles, with a small physical clearance around the body.
  const collider=new THREE.Box3(new THREE.Vector3(3.88,0,4.49),new THREE.Vector3(4.77,2.19,5.23));
  return {group,collider};
}
