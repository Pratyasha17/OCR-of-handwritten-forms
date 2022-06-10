let mainCanvas = document.getElementById('mainCanvas');
let mainContext = mainCanvas.getContext('2d');
let mainImageDiv = document.getElementById('maindiv');
let mouseOut = false;
let mousedown = false;
let canvasMouseDown = false;
let mainImageDivRect = mainImageDiv.getBoundingClientRect();
let xhttp = new XMLHttpRequest();
let pathField = document.getElementById("pathField");
let submitButton = document.getElementById('submitButton');
let blockCoordinates = [];
let fileUploader = document.getElementById('fileUpload');
let nextSelector = document.getElementById('nextPage');
let pageLabel = document.getElementById('pageLabel');
let tableDiv = document.getElementById('checkBoxDiv');
let currentPdfPage = 1;
let pdfPages = 0;
let isPDF = false;
let blockCount = 0;

let x1, y1;
let pageCoordinates;

function toolTip(cords, count) {

    $(".canvas-container").append('<div class="popUp"><p>Enter Text</p><input type="text" name="heading" id="col-name-'+count.toString()+'" /><button class = "submit">Submit</button><div class="arrow"></div><div>');
    let popup =   $(".popUp");
    let height = popup.height();
    popup.css("top", cords.y-(height+35));
    popup.css("left", cords.x);
    $("#col-name-"+count).focus();
    $('.submit').click(function(event){
        event.preventDefault();
        if (!($("#col-name-"+count.toString()).val() === "")){
            console.log(true);
            cords['colName'] = $("#col-name-"+count).val();
        }

        $('.popUp').remove();
    });
    return cords;
}
/**
 * Returns top left point and width and height of the selected rectangle on main Canvas - Based on the two points where
 * mouse was clicked down and up
 * @param {Number} x1 The x coordinate of first point where mouse was down
 * @param {Number} x2 The x coordinate of second point where mouse was down
 * @param {Number} y1 The y coordinate of first point where mouse was down
 * @param {Number} y2 The y coordinate of second point where mouse was down
 * @returns {*[]}  A list with coordinates of top-left point (x, y) and width and height of the rectangle
 */
function get_coords(x1, x2, y1, y2) {
    let width;
    let height;
    let x = x1;
    let y = y1;
    //If x1 is on the right of x2 then set left most point as x2
    if (x1 > x2) {
        x = x2;
    }
    //If y1 is below y2 then set top most point as y2
    if (y1 > y2) {
        y = y2;
    }
    width = Math.abs(x2-x1);
    height = Math.abs(y2-y1);

    return [x, y, width, height]
}

/**
 * Creates check boxes for pages starting from page 2
 * @param pages - Pages = The number of check boxes to create + 1
 */
function createCheckBoxes(pages){

        let table = document.createElement('table');
        tableDiv.appendChild(table);
        let tableBody = document.createElement('tbody');
        table.appendChild(tableBody);
        tableDiv.setAttribute('style', 'user-select:none;');
        let row;

        // As the check boxes are created when at Page 1, the first check box start at page 2
        for (let count = 2; count <= pages; ++count){
            // A row should have only 6 check boxes
            if(count % 6===2){
                row = document.createElement('tr');
                tableBody.appendChild(row);
            }

            let box = document.createElement('td');
            let label = document.createElement('label');
            label.innerHTML = (count).toString();

            let inputElement = document.createElement('input');
            inputElement.setAttribute('type', 'checkbox');
            inputElement.setAttribute('onmouseover', 'check(this)');

            box.appendChild(inputElement);
            box.appendChild(label);

            row.appendChild(box);
        }
 }

function check(box)
{
    //check the box if the mouse key is down
    if(mousedown)
    {
        box.checked = 1-box.checked;
    }
}

/**
 * Loads the given image to the Main Canvas
 * @param {string} url URL/Path (relative to server home path) to the image that needs to be loaded to the canvas
 */
function loadAndDrawImage(url) {
    let image = new Image();
    // console.log(url);
    image.src = url +'?' + new Date().getTime();
    mainContext.imageSmoothingEnabled = false;
    image.onload = function () {
        mainCanvas.width = image.width;
        mainCanvas.height = image.height;
        mainContext.drawImage(image, 0, 0);
    };
}

/**
 * Adds a label to the checked boxes
 * @returns {Array} - An array of the pages selected
 */
function countCheckedBoxes(){
    let pages = [];
    let boxes = tableDiv.getElementsByTagName('td');
    for(let index = 0; index<boxes.length; ++index){

        let children = boxes[index].children;
        if (children[0].checked){

            console.log('Box ', index+2);
            pages.push(parseInt(children[1].innerHTML));
            children[1].innerHTML += " ("+currentPdfPage.toString()+")";
            children[0].checked = false;
            children[0].disabled = true; // Disable the checked boxes when next page is clicked
        }
    }
    return pages;
}

/**
 * Add similar coordinates to selected pages in page Coordinates
 * @param {Array} checkedPages
 */
function insertPagesInCoordinates(checkedPages){
    console.log('Pages with same block coorinates');
    for (let index = 0; index < checkedPages.length; ++index){
        console.log(checkedPages[index]);
            pageCoordinates[checkedPages[index]] = blockCoordinates;
    }
}

function resetPageInfo(){
    pageCoordinates = {};
    blockCoordinates = [];
    currentPdfPage = 1;
    tableDiv.innerHTML = '';
    document.getElementById('ocrResult').innerHTML = '';
    blockCount = 0;

}

/**
 * Click Event Listener for Next button. Sets the selected coordinates of current Page and selected page to the Page coordinates object. Then loads the next Page to Main Canvas whose selection is not done.
 */
nextSelector.addEventListener('click', function(event){
    event.preventDefault();
    $('.popUp').remove();
    pageCoordinates[currentPdfPage] = blockCoordinates;
    let checkedPages = countCheckedBoxes();

    insertPagesInCoordinates(checkedPages);

    while (currentPdfPage in pageCoordinates){
        currentPdfPage += 1;
    }


    if (currentPdfPage<=pdfPages){
        document.getElementById('ocrResult').innerHTML = '';
        // currentPdfPage += 1;
        blockCoordinates = [];
        loadAndDrawImage('static/js/uploads/'+currentPdfPage.toString()+'.jpg');
        pageLabel.innerHTML = currentPdfPage;
        let nextPageRequest = new XMLHttpRequest();
        nextPageRequest.open("POST", '/updatePage', true);
        nextPageRequest.setRequestHeader('Content-type', "application/json;charset=UTF-8");
        nextPageRequest.send(JSON.stringify({'currentPage': currentPdfPage}));

    }
    else{
        alert('No more pages');
   }
});

/**
 * Event Listener for Upload button. Following tasks are perfomed:
 * 1) Entire page info is reset including coordinates selected, text box, check boxes, current page
 * 2) Path from path field is sent to server
 * 3) Based on the first file on the path provided, the server returns if the file is a pdf. If it is a pdf, check boxes will be created based on the number of pages in the PDF
 * 4) First image of the pdf or first image of the folder will be loaded to the cavas from the uploads folder which is updated by the Python Server
 */
fileUploader.addEventListener('click', function(event){
    event.preventDefault();
    resetPageInfo();
    let path = pathField.value;
    let fileUploadRequest = new XMLHttpRequest();
    fileUploadRequest.open("POST", '/upload', true);
    fileUploadRequest.setRequestHeader('Content-type', "application/json;charset=UTF-8");
    fileUploadRequest.send(JSON.stringify({'path': path}));

    fileUploadRequest.onreadystatechange = function(){
    if (fileUploadRequest.readyState===4){
        if(this.status===200){
            let result = JSON.parse(this.responseText);
            if (!result['isPDF']) {
                nextSelector.disabled = true;
                }
            else{
                console.log('It is a pdf');
                isPDF = true;
                pdfPages = result['page_count'];
                nextSelector.disabled = false;
                createCheckBoxes(pdfPages);
            }
            loadAndDrawImage("static\\js\\uploads\\1.jpg");
            }
         }
    };

});

document.onmouseup = function(){
    mousedown = false;
    canvasMouseDown = false;
};

document.onmousedown = function(event){
    mousedown = true;
    if(event.target.id === 'mainCanvas'){
        canvasMouseDown = true;
    }
};

/**
 * Event listener for mouse move. Will scroll the canvas if the mouse was down on canvas and dragged outside the canvas
 *
 */
document.onmousemove = function(event){
    if (canvasMouseDown  && mouseOut){
        //By how many pixels to scroll
        let horizontalLength = 15;
        let verticalLength = 15;
        let verticalOffset = window.pageYOffset;
        let horizontalOffset = window.pageXOffset;

        if (event.clientX > mainImageDivRect.right - horizontalOffset){
            mainImageDiv.scrollLeft += horizontalLength;
        }
        else if(event.clientX < mainImageDivRect.left - horizontalOffset){
            mainImageDiv.scrollLeft -= horizontalLength;
        }

        if (event.clientY > mainImageDivRect.bottom - verticalOffset){
            mainImageDiv.scrollTop += verticalLength;
        }
        else if(event.clientY < mainImageDivRect.top - verticalOffset){
            mainImageDiv.scrollTop -= verticalLength;
        }
    }
};

mainImageDiv.addEventListener('mouseout', function(){
    mouseOut = true;
});

mainImageDiv.addEventListener('mouseenter', function(){
    mouseOut=false;
});

/**
 * Set x1, y1 coordinates to where mouse was down on the Main Canvas
 */
mainCanvas.addEventListener('mousedown', function (event) {
    $('.popUp').remove();
    canvasMouseDown = true;
    const rect = mainCanvas.getBoundingClientRect();
    x1 = Math.ceil(event.clientX - rect.left);
    y1 = Math.ceil(event.clientY - rect.top);
    mainContext.moveTo(x1, y1);
    event.preventDefault();
});

/**
 * Mouseup event listener for Main Canvas.  After the coordinates are calculated, rectangle is drawn if both width and height are not zero. If width and height are not zero, then selected block coordinates are sent to the server for OCR. If successful return from server, the OCR text is displayed in the text box.
 */
mainCanvas.addEventListener('mouseup', function (event) {
    const rect = mainCanvas.getBoundingClientRect();
    let x2 = Math.ceil(event.clientX - rect.left);
    let y2 = Math.ceil(event.clientY - rect.top);
    let [x, y, width, height] = get_coords(x1, x2, y1, y2);
    if (width !== 0 && height !== 0) {
        blockCount += 1;
        let cords = {'x': x, 'y': y, 'width': width, 'height': height, 'colName': 'col-'+blockCount.toString()};
        cords = toolTip(cords, blockCount);
        blockCoordinates.push(cords);
        console.log(blockCoordinates);
        mainContext.rect(x, y, width, height);
        mainContext.stroke();
        xhttp.open("POST", '/ocr', true);
        xhttp.setRequestHeader('Content-type', "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify({'width': width, 'height': height,
                                        "x": x, "y": y}));

        xhttp.onreadystatechange = function(){
        if (xhttp.readyState===4){
            if(this.status===200){
                let result = JSON.parse(this.responseText);
                document.getElementById('ocrResult').innerHTML +='\n' + result['result'];
                }
            }
        };
    }
});

/**
 * Click event listener for Submit Button. Will send all the page coordinates to server for processing and display an alert when the processing is finished.
 */
submitButton.addEventListener('click', function(){
    let processingList = document.getElementById('processingList');
    let processingType = processingList.options[processingList.selectedIndex].text;
    let saveFolder = document.getElementById('savePathField').value;
    if (saveFolder === ""){
        saveFolder = null;
    }
    console.log(processingType);

    let submitRequest = new XMLHttpRequest();
    submitRequest.open("POST", '/submit', true);
    submitRequest.setRequestHeader('Content-type', "application/json;charset=UTF-8");
    submitRequest.send(JSON.stringify({'coordinateData': blockCoordinates, 'is_pdf': isPDF, 'pageCoordinates': pageCoordinates, 'processing': processingType, 'saveFolder': saveFolder}));

    submitRequest.onreadystatechange = function(){
    if (submitRequest.readyState===4){
        if(this.status===200)
        {
            let result = JSON.parse(this.responseText);
            console.log(result['success']);
            if (result['success']){
                alert('Processing Done Sucessfully');
            }else{
                alert('Something went Wrong. Please check console or terminal log.');
            }
        }
    }
    };
});