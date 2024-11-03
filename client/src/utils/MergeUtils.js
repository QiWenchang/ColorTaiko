
export const checkAndGroupConnections = (
    newPair,
    groupMapRef,
    setConnectionGroups,
    connections,
    setConnections
  ) => {
    const [firstConnection, secondConnection] = newPair;
    const [top1, bottom1] = firstConnection.nodes;
    const [top2, bottom2] = secondConnection.nodes;
  
    const topCombination = [top1, top2].sort().join(',');
    const bottomCombination = [bottom1, bottom2].sort().join(',');
  
    const matchingGroups = [];
    const groupTop = groupMapRef.current.get(topCombination);
    const groupBottom = groupMapRef.current.get(bottomCombination);
  
    if (groupBottom) matchingGroups.push(groupBottom);
    if (groupTop && groupTop !== groupBottom) matchingGroups.push(groupTop);
  
    //console.log('Matching Groups:', matchingGroups);
    let mergedGroup = null;
    if (matchingGroups.length > 0) {
      mergedGroup = matchingGroups[0];
  
      newPair.forEach((connection) => {
        connection.color = mergedGroup.color;
        if (!mergedGroup.pairs.includes(connection)) {
          mergedGroup.pairs.push(connection);
        }
      });
  
      mergedGroup.nodes = Array.from(
        new Set([...mergedGroup.nodes, top1, top2, bottom1, bottom2])
      );
  
      for (let i = 1; i < matchingGroups.length; i++) {
        const groupToMerge = matchingGroups[i];
        groupToMerge.pairs.forEach((connection) => {
          connection.color = mergedGroup.color;
        });
        mergedGroup.nodes = Array.from(
          new Set([...mergedGroup.nodes, ...groupToMerge.nodes])
        );
        mergedGroup.pairs = Array.from(
          new Set([...mergedGroup.pairs, ...groupToMerge.pairs])
        );
      }
  
      groupMapRef.current.forEach((group, key) => {
        if (matchingGroups.includes(group) && group !== mergedGroup) {
          groupMapRef.current.delete(key);
        }
      });
  
      groupMapRef.current.set(topCombination, mergedGroup);
      groupMapRef.current.set(bottomCombination, mergedGroup);
  
      console.log('Merged Group:', mergedGroup);
      console.log('GroupMap', groupMapRef.current);
    } else {
      const groupColor = firstConnection.color;
      newPair.forEach((connection) => (connection.color = groupColor));
  
      const newGroup = {
        nodes: [top1, top2, bottom1, bottom2],
        pairs: [...newPair],
        color: groupColor,
      };
  
      groupMapRef.current.set(topCombination, newGroup);
      groupMapRef.current.set(bottomCombination, newGroup);
  
      setConnectionGroups((prevGroups) => [...prevGroups, newGroup]);
    }
    setConnections([...connections]);
  };
  