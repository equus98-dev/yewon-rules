UPDATE Article 
SET contentText = REPLACE(contentText, '정․부회장', '정·부회장'),
    contentJson = REPLACE(contentJson, '정․부회장', '정·부회장')
WHERE id = 'dd098bc2-bfc4-4052-9d11-e3401fc318aa';

UPDATE Article
SET contentText = REPLACE(contentText, '세입세출', '세입·세출'),
    contentJson = REPLACE(contentJson, '세입세출', '세입·세출')
WHERE id = 'd12028bd-dbf6-46c7-bb46-746d87566afe';
