// const Crawler = require('crawler');

// const c = new Crawler({
//     maxConnections: 10,
//     // This will be called for each crawled page
//     callback: (error, res, done) => {
//         if (error) {
//             console.log(error);
//         } else {
//             const $ = res.$;
//             // $ is Cheerio by default
//             //a lean implementation of core jQuery designed specifically for the server
//             // console.log($('title').text());
//             // console.log(res, res.body);
//             document.querySelector('body').innerHTML=res.body; // просто вставили код в нашу html, пока без надобности
//             const abc = res.body; // забрали html в переменную
//             let title = $(abc).find(".description").text().trim(); // при помощи jquery забрали пред. описание
//             let description = $(abc).find(".detailed_full span").text().trim(); // при помощи jquery забрали описание
//             console.log(` Заголовок: ${title}\n Описание: ${description}`); // выводим для теста
//         // console.log($(abc).find(".detailed_full span").text());

//         }
//         done();
//     }
// });

// // Queue just one URL, with default callback
// c.queue('https://povar.ru/recipes/kukuruznaya_kasha_na_vode_dlya_pohudeniya-19407.html');

// document.implementation.createHTMLDocument();

//////////////////////////////////////////////////////////////////////////
//////////////получение информации о рецепте ///////////////
/////////////////////////////////////////////////////////////////////////

// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

// (async () => {
//     try {
// const dom = await JSDOM.fromURL('https://povar.ru/recipes/kukuruznaya_kasha_na_vode_dlya_pohudeniya-19407.html')
// console.log(dom);
// const doc = dom.window.document;
// console.log(doc);
// let title = doc.querySelector('.description').textContent.trim();
// let description = doc.querySelector('.detailed_full span').textContent.trim();

// console.log(title, description);
//     }

//     catch(e) {console.log(e);}
// })()

//////////////////////////////////////////////////////////////////////////
//////////////получение всех ссылок на рецепты со страницы ///////////////
/////////////////////////////////////////////////////////////////////////

// чистый вариант

// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

// (async () => {
//     try {
// const dom = await JSDOM.fromURL('https://povar.ru/list/spagetti/')
// console.log(dom);
// const doc = dom.window.document;
// console.log(doc);
// let recipes = doc.querySelectorAll('.recipe');
// console.log(recipes);
// recipes.forEach(curLink => {
//     let url = curLink.querySelector('.listRecipieTitle').getAttribute('href');
//     let name = curLink.querySelector('.listRecipieTitle').textContent;
//     console.log(`${name}: https://povar.ru${url}`);
// })
//     }

//     catch(e) {console.log(e);}
// })()

// вариант с добавлением в объект + рефакторинг
// const jsdom = require('jsdom');
// const { JSDOM } = jsdom;
// const queue = require('async/queue');
// const dataRecepts = [];

///////////// будет работать только в node среде, то есть на сервере. это запишет результат в файл.

// const fs = require('fs');
// fs.writeFileSync('index.txt', 'Some content');
// const parseFunc = async function (url) {
//   try {
//     console.log(`Парсим ${url}`);
//     const dom = await JSDOM.fromURL(url);
//     const doc = dom.window.document;
//     let recipes = doc.querySelectorAll('.recipe'); // выбираем все дивы с рецептами
//     recipes.forEach(curLink => {
//       let geturl = curLink
//         .querySelector('.listRecipieTitle')
//         .getAttribute('href'); // забрали все ссылки
//       let urlRecipe = `http://povar.ru${geturl}`; // следали из относительного пути - полный

//       if(urlRecipe) {
//         q.push(urlRecipe)
//       }

//       let name = curLink.querySelector('.listRecipieTitle').textContent; // забрали название
//       dataRecepts.push({ title: name, url: urlRecipe}); // добавили в массив
//     });

//     let nextPage = doc.querySelector('.pager > .nav > span.next > a'); // нашли ссылку "следующая страница"
//     if (nextPage) {
//       let nextPageUrl = nextPage.href;
//       q.push(nextPageUrl); // если ссылка не null - то добавляем ее в очередь queue благодаря библиотеке async
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

// console.log(dataRecepts); // выводим сам массив для просмотра

// // библиотека async  - очередь парсинга
// const q = queue(async (url, done) => {
//   await parseFunc(url);
//   done();
// });

// q.push('https://povar.ru/list/spagetti/5'); // запуск парсера идет отсюда, затем он уходит в функцию parseFunc, в которой есть условие, если следующая страница активна, то добавляем ссылку на нее в эту же очередь, которая снова запускает функцию.

// (async () => {
//   await q.drain(function () {
//     // assign a callback https://caolan.github.io/async/v3/docs.html#queue
//     console.log(`Успешно! Добавлено: ${dataRecepts.length} записей`);
//   });
// })();

const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const queue = require('async/queue');
const fs = require('fs');
const dataRecepts = [];

async function parseFunc(url, isDetailed) {
  try {
    const dom = await JSDOM.fromURL(url);
    const doc = dom.window.document;

    if (!isDetailed) {
      console.log(`Парсим страницу ${url}`);
      let recipes = doc.querySelectorAll('.recipe'); // выбираем все дивы с рецептами
      recipes.forEach(curLink => {
        let geturl = curLink
          .querySelector('.listRecipieTitle')
          .getAttribute('href'); // забрали все ссылки
        let urlRecipe = `http://povar.ru${geturl}`; // следали из относительного пути - полный

        if (urlRecipe) {
          q.push({ url: urlRecipe, isDetailed: true });
        }
      });

      let nextPage = doc.querySelector('.pager > .nav > span.next > a'); // нашли ссылку "следующая страница"
      if (nextPage) {
        let nextPageUrl = nextPage.href;
        q.push({ url: nextPageUrl, isDetailed: false }); // если ссылка не null - то добавляем ее в очередь queue благодаря библиотеке async
      }
    } else {
      console.log(`Индексируем карточку ${url}`);
      const title = doc
        .querySelector(
          '#mainWrapper > div.mcol.recipie_detailed > div.cont_area.hrecipe > h1'
        )
        .textContent.trim();
      const dectriptionPreview = doc
        .querySelector(
          '#mainWrapper > div.mcol.recipie_detailed > div.cont_area.hrecipe > span.detailed_full.description'
        )
        .textContent.trim();
      const descriptionFull = doc
        .querySelector(
          '#mainWrapper > div.mcol.recipie_detailed > div.cont_area.hrecipe > span:nth-child(15) > span'
        )
        .textContent.trim();
      dataRecepts.push({
        title: title,
        url: url,
        dectriptionPreview: dectriptionPreview,
        descriptionFull: descriptionFull,
      });
    }
  } catch (e) {
    console.log(e);
  }
}

// библиотека async  - очередь парсинга
const q = queue(async (url, done) => {
  await parseFunc(url.url, url.isDetailed);
  done();
});

q.push({ url: 'https://povar.ru/list/spagetti/5', isDetailed: false }); // запуск парсера идет отсюда, затем он уходит в функцию parseFunc, в которой есть условие, если следующая страница активна, то добавляем ссылку на нее в эту же очередь, которая снова запускает функцию.

(async () => {
  await q.drain(function () {
    // assign a callback https://caolan.github.io/async/v3/docs.html#queue
    fs.writeFileSync('./result.json', JSON.stringify(dataRecepts)); // запускать из терминала "node code.js"
    console.log(`Успешно! Добавлено: ${dataRecepts.length} записей`);
    console.log(dataRecepts); // выводим сам массив для просмотра
  });
})();
