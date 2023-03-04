export const removeDuplicateIDs = (arr) => {
  const newArr = arr.reduce((result, item) => {
    const itemExists = result.find((r) => r.id === item.id);
    if (itemExists) return result;
    return result.concat([item]);
  }, []);

  return newArr;
};