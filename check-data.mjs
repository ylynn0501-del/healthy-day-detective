import { categories } from './questions.js';
if (categories.length !== 5) throw new Error('영역 수가 5가 아닙니다.');
for (const category of categories) {
  if (category.questions.length < 8) throw new Error(`${category.name} 문제 수가 부족합니다.`);
  for (const item of category.questions) {
    if (!item.options.length || !item.body.length || !item.mind.length || !item.habit) throw new Error(`${item.id} 데이터가 불완전합니다.`);
    if (item.options.length !== 3 || !item.options.includes(item.answer)) throw new Error(`${item.id} 정답 선택지가 올바르지 않습니다.`);
    if (item.body.length !== 3 || item.mind.length !== 3) throw new Error(`${item.id} 연결 선택지가 올바르지 않습니다.`);
  }
}
console.log(`검증 완료: ${categories.length}개 영역, ${categories.reduce((sum,c)=>sum+c.questions.length,0)}개 문제`);

