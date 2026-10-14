# Revision 16 validation

- Production TypeScript/Vite build passed for the current scene source (exit0;259 modules). Existing chunk-size advisory remains.
- Actual runtime screenshots: 26 PNGs in revision-16/review-1, ten selected Room Guide views plus entrance, weather and phone captures; browser errors0; phone width/scroll both390px.
- Focused pillow audit:13 closed, positive-volume shells; seven printed-front/plain-back non-emissive cat cushions. New cushions have actual side depths0.533-0.561m and filled volumes0.162-0.188m3. Bases have broad contact. No sampled duvet vertices inside any pillow and no sampled new-cushion vertices inside other pillow bodies at2mm tolerance. Inspection cameras outside pillows. This is not exhaustive triangle-triangle collision proof.
- The focused preflight result is copied byte-for-byte to geometry-final/pillows.json: scene source is unchanged between that test, final captures and full audit.
- Full room audit passed: finite geometry; 1,975,680 unique /2,317,780 instance-expanded triangles, under the new2,000,000 unique-triangle budget (the added row costs141,694 triangles including seams). All270 sampled TV rays clear; closed manifold duvet; no duvet wall/nightstand crossings; weather, collapse and reduced-motion controls pass.
- Duvet east boundary now reaches up to1.107m from the wall to end at the new forward cushions. Sheet and mattress still fill the alcove. Nominal unfolded duvet9.10x9.46m, measured gathered centre surface9.162x8.637m; average thickness0.245m.
- Existing window-side pillows unchanged. New cushions sit only against the opposite east-wall row, outside the left sash sweep. Historical window sweep evidence remains revision15; no new sweep claim.
- Independent formal round1:8.8/10 accepted against the8 minimum, below9 aspiration. Two rounds unused. No technical check earns visual points. Historical revision15's below9 result remains unchanged.
- Existing100 native-resolution revision12 Snapshots preserved. No external assets/services, paid operations, deployment or commit.

Evidence: test-artifacts/north-city/revision-16/geometry-final/{pillows,audit}.json and revision-16/review-1/bedding-results.json.
