---
title: "Full Text Search no Postgres"
date: 2023-03-03T08:21:11+03:00
tags: ["Postgres", "SQL", "Full Text"]
draft: false
cover:
  image: '/sql.jpg'
---

## Busca textual em SQL

Em geral quando pensamos em busca textual em SQL a primeira coisa que pensamos é em usar o LIKE:

```SQL
SELECT
	first_name,
  last_name
FROM
	customer
WHERE
	first_name LIKE 'Jen%';
```

Porém para buscas mais complexas, se torna bem difícil e pouco performático varrer toda uma tabela em busca de uma padrão de caracteres. Para esses casos em que queremos resultados relevantes para um ou mais termos podemos usar uma recurso bem interessante disponibilizado pela maioria dos bancos SQL , o Full Text Search.

## Full Text Search

Para utilizar o recurso no Postgres é relativamente simples, digamos que nosso banco tenha uma tabela `products` com campos VARCHAR `product_name` e `product_description`.
```SQL
CREATE TABLE products (
                 product_id SERIAL PRIMARY KEY,
                 product_name VARCHAR (50),
								 product_description VARCHAR (200),
                 product_price NUMERIC(5,2)  
             );
```
```SQL
INSERT INTO products(product_name,product_description, product_price) VALUES 
	('ASUS RGB Leds','Fancy RGB leds for PC decoration', 15.00),
	('HP RGB Leds','Simple RGB leds for PC decoration', 10.00),
	('HP Cooler Fan','A strong fan for any CPU ', 10.00),
	('Intel i3 CPU','Basic processor for computers', 50.00),
	('Intel i5 CPU','Intermediate processor for computers', 75.00),
	('Intel i7 CPU','Advanced processor for computers', 100.00),
	('AMD 586 CPU','Modern processor for computers', 100.00),
	('HP Mouse','Simple wired HP mouse', 12.00),
	('ASUS Mouse','Simple wired ASUS mouse', 14.99),
	('Xiomi Mouse','Xiomi gamer mouse with RGB', 18.99),
	('HP Kitty Mouse','Fancy Kitty decorated HP mouse', 25.50),
	('Corsair RAM Memory 2GB','Basic desktop RAM Memory - 2GB', 20.00),
	('Corsair RAM Memory 4GB','Intermediate desktop RAM Memory - 4GB', 40.00),
	('Corsair RAM Memory 8GB','Advanced desktop RAM Memory - 8GB', 60.00);
             
```

Para realizarmos uma busca nos nomes do produtos podemos usar 
```SQL
SELECT product_name, product_price FROM products 
	WHERE to_tsvector(product_name) @@ to_tsquery('CPU');
```
```SQL
 product_name | product_price 
--------------+---------------
 Intel i3 CPU |         50.00
 Intel i5 CPU |         75.00
 Intel i7 CPU |        100.00
 AMD 586 CPU  |        100.00
(4 rows)
```

No caso acima estamos procurando o termo desejado apenas na coluna `product_name`, mas para essa tabela em específico seria mais interessante que a busca incluísse também a coluna `product_description`,

```SQL
SELECT product_name, product_price FROM products 
	WHERE to_tsvector(product_name) || to_tsvector(product_description)  
		@@ to_tsquery('CPU');
```
```SQL
 product_name  | product_price 
---------------+---------------
 HP Cooler Fan |         10.00
 Intel i3 CPU  |         50.00
 Intel i5 CPU  |         75.00
 Intel i7 CPU  |        100.00
 AMD 586 CPU   |        100.00
(5 rows)
```
Perceba que neste caso seria interessante que os resultados fossem ordenados por relevância, então que tal usarmos o `ts_rank` para que apareçam primeiro os resultados em que o termo procurado esteja no nome do produto? 

```SQL
SELECT product_name, product_price FROM products 
	WHERE to_tsvector(product_name) || to_tsvector(product_description)  
		@@ to_tsquery('CPU')
	ORDER BY 
		ts_rank(
      setweight(to_tsvector(product_name),'A') ||
			setweight(to_tsvector(product_description),'B')
    , to_tsquery('CPU'))
     DESC;
```
```SQL
 product_name  | product_price 
---------------+---------------
 Intel i3 CPU  |         50.00
 Intel i5 CPU  |         75.00
 Intel i7 CPU  |        100.00
 AMD 586 CPU   |        100.00
 HP Cooler Fan |         10.00
(5 rows)
```

## Performance


Logicamente essa abordagem de pesquisa não é tão performática já que continuamos varrendo toda a tabela pra gerar os vetores FTS e compararmos com o termo procurado, então que tal criamos um outra coluna que vai conter os vetores criados a partir das colunas relevantes da nossa tabela de produtos. Também podemos aproveitar e criar um índice para esta coluna e agilizarmos mais ainda as buscas futuras.

```SQL
ALTER TABLE products
	ADD COLUMN search_vectors_col tsvector
		GENERATED ALWAYS AS (
			setweight(to_tsvector('english',product_name),'A') || 
			setweight(to_tsvector('english',product_description),'B')
		) STORED;

CREATE INDEX idx_fts ON products
		USING gin(search_vectors_col);
```

Agora nossas buscas além de menos custosas vão ser até mais simples:

```SQL
SELECT product_name, product_price FROM products 
	WHERE search_vectors_col @@ to_tsquery('CPU')
	ORDER BY ts_rank(search_vectors_col, to_tsquery('CPU')) DESC;
```

## Veja também

Abuse do `to_tsquery` usando operadores lógicos de acordo com a necessidade da sua aplicação, ex: `to_tsquery('CPU & Intel')`, `to_tsquery('CPU | processor')`, `to_tsquery('CPU & !AMD')`.

O recurso FTS do Postgres também suporta múltiplas línguas assim como o uso da extensão `pg_trgm` para permitir a busca com erros ortográficos e a extensão `unaccent` pra melhorar as buscas com caracteres acentuados.

Perceba também que ao criarmos o índice para nossa coluna de vetores nós usamos um índice do tipo `GIN`, mas também temos a opção de usar o tipo `GiST` cabendo ao desenvolvedor escolher aquele que mais se [adequar à sua necessidade](https://www.postgresql.org/docs/9.1/textsearch-indexes.html).

Continue pesquisando sobre o tema e happy coding, guys. 