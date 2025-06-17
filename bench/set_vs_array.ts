const runs = 1e6;
const arr  = Array.from({ length: 1e5 }, (_, i) => i.toString());
const set  = new Set(arr);

console.time('Array.includes');
for (let i = 0; i < runs; i++) arr.includes('90000');
console.timeEnd('Array.includes');

console.time('Set.has');
for (let i = 0; i < runs; i++) set.has('90000');
console.timeEnd('Set.has');
