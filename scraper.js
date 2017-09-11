const fs = require('fs'),
	scrapeIt = require("scrape-it"),
	json2csv = require('json2csv'),
	moment = require('moment');

let url = "http://shirts4mike.com/";
//if not data folder exists one is created
if(!fs.existsSync('data')){
	fs.mkdir('data');
}

// Promise interface
scrapeIt(url + "shirt.php", {
	shirts: {
		listItem: ".products li",
			data: {
				url: {
					selector: "a",
					attr: "href"
				}
			}
		}
}).then(response => {

	let shirts = response.shirts;
  let scrapedShirts = shirts.map(scrapeShirts);
  let results = Promise.all(scrapedShirts);

	results.then((result) => {
		//result is each shirt scraped in an array and the data is converted
		//to csv when the results promise is finished
		let csv = json2csv({ data: result});
		let date = moment().format('YYYY[-]MM[-]DD');

		fs.writeFile(`data/${date}.csv`, csv, function(error) {
			if (error) throw error;
			console.log('file saved');
		});//write file
	});//then results
}).catch(error => {
  if (error) {
    let msg = `There's been an ${error.code} error. Cannot connect to the website ${error.host}!\n`;
    logError(msg);
  };
});

function scrapeShirts(shirt){
  return scrapeIt(`http://www.shirts4mike.com/${shirt.url}`, {
    title: 'title',
    price: '.price',
    imgURL: {
      selector: 'img',
      attr: 'src'
    },
    url: {
      selector: 'img',
      attr: 'src',
      convert: x => toUrl(x)
    },
		createdAt: {
	    selector: ".date",
			convert: x => toTime()
    }
  });
}

function toTime(){
	return moment().format('LT');
}

function toUrl(url){
  let id = url.match(/\d+/g);
  return `http://www.shirts4mike.com/shirt.php?id=${id}`;
}

//fn to log error messages to the scraper-error.log file
function logError(error){
  let time = moment().format('LLLL');
  let logStream = fs.createWriteStream('scraper-error.log', {'flags': 'a'});
	console.log(`${time} ${error} \n`);
  logStream.write(`${time} ${error} \n`);
  logStream.end();
}
