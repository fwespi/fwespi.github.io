(() => {
	Office.initialize =  (reason) => {};
})();

function substituteCharacters (event, mapping) {
	Word.run( async context => {		
		const selection = context.document.getSelection();
		for(let n=0; n<mapping.length; n++){
			const char = mapping[n][0];
			const results = selection.search(char, {matchCase: true });
			context.load(results);
			await context.sync();
			for(let i = 0; i < results.items.length; i++) {
				results.items[i].insertText(mapping[n][1], "replace");
			};
		};
		await context.sync();
	});
	
	if(event)
		event.completed();
};

async function convertTransliteration (event) {
	const response = await fetch('./data/Transliteration.json');
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertCoptic (event) {
	const response = await fetch('./data/Coptic.json');
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertGreek (event) {
	const response = await fetch('./data/Greek.json');
	const data = await response.json();
	substituteCharacters(event, data.map);
};
