import { Graph, alg } from '@dagrejs/graphlib'


// // src/utils/checkOrientation.js
// import { Graph, alg } from '@dagrejs/graphlib';

// export function checkOrientation(latestPair, groupMapRef, topOrientationRef, botOrientationRef) {
//   const { findCycles } = alg;

//   // 1) Add this new orientation edge into the appropriate map
//   const newConn = latestPair[1];
//   const [u, v] = newConn.nodes;
//   const orientationRef = u.startsWith('top') ? topOrientationRef : botOrientationRef;
//   orientationRef.current.set(u, v);

//   // 2) For both the top‐row and bottom‐row orientation maps…
//   for (const oriMap of [topOrientationRef.current, botOrientationRef.current]) {
//     // a) build a directed Graph
//     const g = new Graph({ directed: true });
//     // b) add every vertex and edge
//     oriMap.forEach((to, from) => {
//       g.setNode(from);
//       g.setNode(to);
//       g.setEdge(from, to);
//     });

//     // c) find all simple cycles
//     const cycles = findCycles(g);
//     if (cycles.length === 0) continue;

//     // d) scan for any cycle < 4 nodes
//     for (const cycle of cycles) {
//       if (cycle.length < 4) {
//         // too short—signal failure
//         return -1;
//       }
//     }
//   }

//   // no bad cycles found
//   return 1;
// }
