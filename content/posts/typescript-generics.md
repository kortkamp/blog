---
title: "Usando Generics no Typescript"
date: 2022-10-17T09:21:11+03:00
tags: ["Typescript", "Javascript"]
draft: false
cover:
  image: '/ts_logo.png'
---

## Typescript

Creio que a maioria dos devs se não faz uso, pelo menos reconhece a importância de se usar typescript nos projetos JS. Eu venho de linguagens tipadas, então quando passei a utilizar essa tecnologia senti que as coisas ficam muito melhor organizadas e fica muito mais fácil encontrar ou mesmo prevenir erros no código. 

Uma das grandes vantagens do Javascript é que a linguagem é muito dinâmica, até mesmo permissiva se podemos dizer assim, porém o Typescript não precisa sempre engessar nosso código a ponto de perdermos essa característica. Hoje gostaria de deixar aqui minha experiência com o uso de **generics** que de alguma maneira me causava uma certa resistência no começo do meu aprendizado de TS.

Podemos definir o tipo do retorno de uma função na própria declaração da mesma: 
```Typescript
function myFunc2(): string {
  return 'hello people!';
}
```

Porém o Typescript é esperto o suficiente para, na maioria das vezes,  inferir o tipo de retorno baseando-se apenas no código em si. 

```Typescript
function myFunc2() {
  return 'hello people!';
}
```
Os dois trechos acima vão retornar o mesmo tipo embora o primeiro trecho informe um erro de tipagem caso tentemos retornar um **number** por exemplo e essa funcionalidade pode ser bem útil em alguns casos.

```Typescript
function myFunc2(): string {
  return 1;
}
```
{{< errorCode >}}
  Type 'number' is not assignable to type 'string'.ts(2322)
{{< /errorCode >}}



É claro que o Typescript roda tempo de desenvolvimento, não em tempo de execução, então como podemos fazer, por exemplo, uma função com tipo de retorno dinâmico? 

Uma alternativa é usar os *union types*: 

```Typescript
function myFunc3(prop: number | string):number | string {
  return prop;
}
```

Porem essa abordagem pode nos causar alguns problemas, pois o Typescript não vai inferir dinamicamente um tipo de retorno e poderá gerar erros como o abaixo:

```Typescript

const a = myFunc3('hello');

a.toUpperCase();
```


{{< errorCode >}}
Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.ts(2339)
{{< /errorCode >}}

## Generics

Com os casos em que queremos que uma função possa receber argumentos de mais de um tipo podemos fazer uso dos Generics do Typescript:

```Typescript
function myfunc<T>(prop: T) {
  return prop;
}
```
O primeiro \<T> ao lado do nome da função informa ao transpilador que T é um tipo genérico, ou seja deve ser informado ou inferido em cada caso onde fizermos uso da função. Já o segundo T após o parâmetro 'prop' indica que é daqui que vamos inferir o tipo de T. Isso é necessário porque em teoria nossa função pode receber vários argumentos, inclusive não Generics.

```ts
function myFunc<T>(prop1: T, prop2: string, prop3: string) {
  return prop1;
}
```
O Generic também não precisa ser único na função, podemos ter múltiplos generics na mesma função: 

```javascript
function myFunc<T, U, V>(prop1: T, prop2: U, prop3: V): [T, U, V] {
  return [prop1, prop2, prop3];
}

const a = myFunc('hi', 4, 5);

```
Neste caso o Typescript vai inferir corretamente que o tipo de 'a' é um array composto dessa forma.

```
const a: [string, number, number]
```
Abaixo temos um exemplo um pouco menos simples. Nesse caso o generic T está sendo definido pelo tipo de retorno da função recebida nos parâmetros. Note que o retorno da função recebida por parâmetro e 'defaultValue' tem o mesmo tipo, desse modo o Typescript vai fazer essa validação inclusive gerando erro caso o tipo não seja o mesmo e esse comportamento é extremamente útil para a prevenção de erros no nosso código.

```ts
function myFunc<T>(anotherFunc: () => T, defaultValue?: T) {
  if (defaultValue) {
    return defaultValue;
  }
  return anotherFunc();
}

const a = myFunc(() => 'hello', 'olá');

```

## Conclusão


O uso de generics facilita muito o reaproveitamento de código nos nossos projetos e vale muito a pena pra quem está aprendendo Typescript gastar um tempinho estudando e treinando essa funcionalidade da linguagem.


 