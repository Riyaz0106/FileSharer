const fileInput = document.getElementById("uploadfile"),
	form = document.getElementById("upform"),
	progressArea = document.querySelector(".progress-area"),
	uploadedArea = document.querySelector(".uploaded-area");

const alertDiv = document.getElementById("msgalert"),
	newalert = document.createElement("div");
	newalertclosebtn = document.createElement("button");

newalert.setAttribute('role', 'alert');
newalertclosebtn.setAttribute('class', 'btn-close');
newalertclosebtn.setAttribute('type', 'button');
newalertclosebtn.setAttribute('data-bs-dismiss', 'alert');
newalertclosebtn.setAttribute('aria-label', 'Close');


// form click event
form.addEventListener("click", () =>{
  	fileInput.click();
});

fileInput.onchange = ({target})=>{
	let file = target.files[0]; //getting file [0] this means if user has selected multiple files then get first one only
	if(file){
		let fileName = file.name; //getting file name
		if(fileName.length >= 12){ //if file name length is greater than 12 then split it and add ...
			let splitName = fileName.split('.');
			fileName = splitName[0].substring(0, 13) + "... ." + splitName[1];
		}
		uploadFile(fileName); //calling uploadFile with passing file name as an argument
	}
}
// @reference https://www.codingnepalweb.com/file-upload-with-progress-bar-html-javascript/
// file upload function
function uploadFile(name){
	let fileSize;
	let xhr = new XMLHttpRequest(); //creating new xhr object (AJAX)
	// xhr.overrideMimeType("text/html");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			var url = xhr.responseURL.split('?')[1]
			var key = url.split('=')[0]
			var val = url.split('=')[1]
			if (key === 'errmsg'){
				newalert.setAttribute('class', 'alert alert-danger alert-dismissible');
				newalert.setAttribute('style', 'animation: fadeInRight 1s ease-in-out; width: 550px;')
				newalert.innerHTML = val.split('%20').join(' ')+' Failed to upload file';
				newalert.appendChild(newalertclosebtn);
				alertDiv.appendChild(newalert);

				progressArea.innerHTML = "";
				let uploadedHTML = `<div style= "background-color: #ffe9e9;" class="row align-items-start">
										<div style="max-width:30px;" class="col">
											<center>
												<i style="font-size:30px" class="fa fa-file-text"></i>
											</center>
										</div>
										<div class="col">
											<div class="content upload">
												<div class="details">
													<span class="name">${name} • Upload failed</span>
													<span class="size">${fileSize}</span>
												</div>
											</div>
										</div>
										<div style="max-width:40px;" class="col">
											<center>
												<i style="font-size:20px; color: red" class="fa fa-times"></i>
											</center>
										</div>
									</div>`;
				uploadedArea.classList.remove("onprogress");
				// uploadedArea.innerHTML = uploadedHTML; //uncomment this line if you don't want to show upload history
				uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTML); //remove this line if you don't want to show upload history
			} else{
				newalert.setAttribute('class', 'alert alert-success alert-dismissible');
				newalert.setAttribute('style', 'animation: fadeInRight 1s ease-in-out; width: 950px;')
				newalert.innerHTML = val+'='+url.split('=')[2];
				newalert.appendChild(newalertclosebtn);
				alertDiv.appendChild(newalert);

				progressArea.innerHTML = "";
				let uploadedHTML = `<div class="row align-items-start">
										<div style="max-width:30px;" class="col">
											<center>
												<i style="font-size:30px" class="fa fa-file-text"></i>
											</center>
										</div>
										<div class="col">
											<div class="content upload">
												<div class="details">
													<span class="name">${name} • Uploaded</span>
													<span class="size">${fileSize}</span>
												</div>
											</div>
										</div>
										<div style="max-width:40px;" class="col">
											<center>
												<i style="color: green; font-size:20px" class="fa fa-check"></i>
											</center>
										</div>
									</div>`;
				uploadedArea.classList.remove("onprogress");
				// uploadedArea.innerHTML = uploadedHTML; //uncomment this line if you don't want to show upload history
				uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTML); //remove this line if you don't want to show upload history
			}
		}
	}
	xhr.open("POST", "/upload/file"); //sending post request to the specified URL
	xhr.upload.addEventListener("progress", ({loaded, total}) =>{ //file uploading progress event
		let fileLoaded = Math.floor((loaded / total) * 100);  //getting percentage of loaded file size
		let fileTotal = Math.floor(total / 1000); //gettting total file size in KB from bytes
		// if file size is less than 1024 then add only KB else convert this KB into MB
		(fileTotal < 1024) ? fileSize = fileTotal + " KB" : fileSize = (loaded / (1024*1024)).toFixed(2) + " MB";

		let progressHTML = `<div class="row align-items-start">
								<div style="max-width:30px;" class="col">
									<center>
										<i style="font-size:30px" class="fa fa-file-text"></i>
									</center>
								</div>
								<div class="col">
									<div class="content">
										<div class="details">
											<span class="name">${name} • Uploading</span>
											<span class="percent">${fileLoaded}%</span>
										</div>
										<div class="progress-bar">
											<div class="progress" style="width: ${fileLoaded}%"></div>
										</div>
									</div>
								</div>
							</div>`;	
		// uploadedArea.innerHTML = ""; //uncomment this line if you don't want to show upload history
		uploadedArea.classList.add("onprogress");
		progressArea.innerHTML = progressHTML;

	});
	let data = new FormData(form); //FormData is an object to easily send form data
	xhr.send(data); //sending form data
}
