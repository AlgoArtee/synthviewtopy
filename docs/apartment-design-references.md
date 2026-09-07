# Apartment design diversity

Consulted on 7 September 2026:

- [DesignCafe: A Guide to Living Room Interior Design Styles](https://www.designcafe.com/guides/living-room-interior-styles/)
- [Decorilla: Interior Design Styles 101](https://www.decorilla.com/online-decorating/interior-design-styles-101)

DesignCafe differentiates living spaces through furniture arrangement, texture and materials: industrial masonry and metal, Scandinavian light wood, traditional symmetry, coastal stripes and rustic joinery. Decorilla also emphasizes recognizable furniture forms, open space in Scandinavian rooms, geometry and polished surfaces in Art Deco, natural curves in organic interiors, and layered patterns in bohemian rooms. These principles informed the new room designs; no photographs or furniture models from either article were copied.

## Implementation

The 100 numbered rooms retain their stable IDs, editable names, individual palettes, shared Academic District courtyard and original Lab Island sky. A style profile now changes the complete furnishing and surface composition, instead of concentrating differences in a pendant and colour palette.

| Design family | Authored changes |
| --- | --- |
| Traditional / Gothic | Upholstered formal seating, carved beds, patterned walls or timber panels, stone or parquet floors, coffered ceilings |
| Art Deco | Scalloped seating, channelled headboards, geometric tables, fluted walls and checkerboard stone |
| Modern / Nordic | Modular or open timber seating, geometric or woven textiles, lighter surfaces and open shelving |
| Japanese | Low platforms, timber slats, tatami borders, raised blinds and low bookcases |
| Industrial | Steel-framed seating and shelves, masonry or concrete, visible overhead pipework |
| Organic | Curved upholstery and tables, oval rugs, lighter stone, planted wall panels |
| Space Age / Aero | Moulded pod furniture, pedestal tables, terrazzo, raised blinds and circular ceiling details |
| Bohemian | Woven furniture, layered kilim rugs, wall textiles and terracotta |
| Coastal / Rustic | Slatted or substantial timber frames, oak floors, linen and exposed beams |

All rooms retain a substantial book collection and study space as the Dark Academia component. `roomDesign.ts` selects structural profiles from the stable catalog style; `diverseFurniture.ts` creates sofa, chair, table and bed meshes; `designSurfaces.ts` creates original repeating surface and textile patterns. `styledRoom.ts` applies the architecture, shelving and furnishings to each independent scene. Existing scanned furniture materials remain local.

## Advanced computers

Every apartment, including the original Liminette room, uses `advancedWorkstation.ts`: one curved ultrawide display, two angled auxiliary displays, a glass touch deck, slim titanium/graphite hardware and a compact processing dock projecting a rotating volumetric molecular model. The four display textures contain original scientific dashboards. Hardware is independent of the room's historical or contemporary style, with all mesh, line, point and texture resources disposed on scene departure.

## Verification

`npm run test:apartment-diversity` verifies every residence's workstation, actual scene geometry and common outlook, renders 100 gallery previews, and captures entrance/study/lounge/sleep views and movement for each furniture family. `DIV_ROOMS` selects a comma-separated numbered subset, `DIV_PUBLISH_PREVIEWS=0` disables public image writes, `DIV_OUTPUT` chooses evidence output, and `BASE_URL` selects development or production preview. Existing apartment and catalog checks remain available for navigation, metadata and loading recovery.
