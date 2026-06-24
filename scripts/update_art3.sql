UPDATE Article SET contentJson = replace(contentJson, ',', ', ') WHERE articleNumber = 3 AND contentJson LIKE '%교양학부,%';
