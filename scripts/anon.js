var anonymized = [];
var anonDictionaries = {};

function saveAnonymizedData(d) {
	if (anonymized.length == 0)
		return;
	var blob = new Blob(anonymized, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "anonymized_home_data.csv");
}

function saveMappings(d) {
	if (anonDictionaries.length == 0)
		return;
	//var blob = new Blob([JSON.stringify(anonDictionaries)], {type: "text/plain;charset=utf-8"});
	//saveAs(blob, "mappings.json");
	for (var key in anonDictionaries) {
		if (anonDictionaries.hasOwnProperty(key)) {
			var string = ""
			for (var item in anonDictionaries[key]) {
				string += item;
				string += ",";
				string += anonDictionaries[key][item];
				string += "\n"
			}
			var blob = new Blob([string], {type: "text/plain;charset=utf-8"});
			saveAs(blob, key.concat("_key.csv"));
		}
	}
}


function anonymize(file, anonConfig) {
	var results = Papa.parse(file, {
		newline: "\n",
		worker: true,
		step: function(row) {
			var columns = row.data[0];
			if (columns.length === 1) { return; }

			anonConfig.forEach(function(item) {
				if (item.anon_type == 1) {
					if (anonDictionaries[item.name] == null) {
						anonDictionaries[item.name] = {};
					}
					var anonFieldValue = anonDictionaries[item.name][columns[item.index]];
					if (anonFieldValue == null) {
						anonFieldValue = Object.keys(anonDictionaries[item.name]).length;
						anonDictionaries[item.name][columns[item.index]] = anonFieldValue;
					}
					columns[item.index] = anonFieldValue;
				} else if (item.anon_type == 4) {
					var date = new Date(columns[item.index]);
					columns[item.index] = date.getFullYear();
				}
			});
			anonymized = anonymized.concat(columns.join(",")+"\n");
		},

		complete: function() {
			console.log("All done!");
		}
	});
}

$.getJSON('./conf/anonymize.conf', function(data) {
		var anonConfig = data;
		Dropzone.options.myDropzone = {
		init: function() {
			var self = this;

			self.options.maxFiles = 1;
			self.options.createImageThumbnails = false;
			self.options.addRemoveLinks = true;
			self.options.dictRemoveFile = "Delete";

			self.on("addedfile", function(file) {
				anonymize(file, anonConfig);
			});

			// Send file starts
			self.on("sending", function(file) {
				console.log('upload started', file);
			});

			// On removing file
			self.on("removedfile", function(file) {
				console.log("removedfile ", file);
			});
		}
	};
});
