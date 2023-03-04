---
title: "Removendo objetos duplicados em Array JS"
date: 2022-11-13T10:08:00+03:00
tags: ["Array", "Javascript"]
draft: true
cover:
  image: '/ts_logo.png'
---

## Arrays



```ts
export const removeDuplicateIDs = <T extends { id: any }>(arr: T[]) => {
  const newArr = arr.reduce((result, item) => {
    const itemExists = result.find((r) => r.id === item.id);
    if (itemExists) return result;
    return result.concat([item]);
  }, [] as T[]);

  return newArr;
};

```