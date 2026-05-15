# student-detail.html

## javascript

### renderStudentDetail(student) 

```js
const academyName = selectedAcademy?.name || "임시 학원";
```

`?.` : optional chaining => selectedAcademy가 있으면 selectedAcademy.name을 사용, selectedAcademy가 없으면 undefined를 반환

```js
Object.entries(fieldValues).forEach(([field, value]) => {
    const target = document.querySelector(`[data-student-field="${field}"]`);

    if (target) {
    target.textContent = value;
    }
}
```

1. 학생의 기본 정보들이 담긴 객체 fieldValues를 Object.entries(fieldValues)로 배열로 변경
2. 각각 field와 value로 구조분해할당
3. target에는 <dd data-student-field="fullName">...</dd>의 요소가 들어가게 된다.

```html
  <dl>
    <div>
      <dt>이름</dt>
      <dd data-student-field="fullName">케이</dd>
    </div>
    <div>
      <dt>생일</dt>
      <dd data-student-field="birthday">임시 데이터</dd>
    </div>
    <div>
      <dt>공격 타입</dt>
      <dd data-student-field="attackType">신비</dd>
    </div>
  </dl>
```

4. 요소는 html에 남아있고, 지역변수인 target은 사라짐

  const cards = TERRAIN_KEYS.map((terrainKey) => {
    const terrain = TERRAIN_META[terrainKey];
    const rank = adaptation?.[terrainKey] ?? null;
    const rankImageUrl = rank ? TERRAIN_RANK_IMAGE_URLS[rank] : null;

    const card = document.createElement("article");
    card.className = "terrain-aptitude-card";

    const terrainImage = document.createElement("img");
    terrainImage.className = "terrain-place-image";
    terrainImage.src = terrain.imageUrl;
    terrainImage.alt = terrain.label;

    const body = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = terrain.label;

    body.append(title);

    if (rankImageUrl) {
      const rankImage = document.createElement("img");
      rankImage.className = "terrain-rank-image";
      rankImage.src = rankImageUrl;
      rankImage.alt = rank;
      body.append(rankImage);
    } else {
      const empty = document.createElement("span");
      empty.textContent = "데이터 없음";
      body.append(empty);
    }

    card.append(terrainImage, body);
    return card;
  });

### renderTerrainAdaptations(student)

1. adaptation 값으로 studentId 또는 studentSlug 값을 넣는다.
2. 