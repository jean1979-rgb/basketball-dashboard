// testAccel.js

import { analyzeTrend } from './utils/accel.js';

const fakeData = [90, 92, 91, 95, 99, 102, 101, 103, 107, 108];
const result = analyzeTrend(fakeData);

console.log('📈 Inflexiones detectadas:');
console.log(result.inflections);
