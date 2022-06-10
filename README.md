
# OCR
OCR is a tool designed to help teams extract data from documents seamlessly. It is a web application that allows a user to select multiple blocks on a document and extract data from these blocks across all selected documents and consolidate them into Excel(s). 

## Features

OCR minimizes making the templates for long documents. It allows you to group all pages which have the same template.

## Automatic extraction from PDF

OCR automatically handles the conversion of PDF to images so you don't have to. All you have to do is select the folder with all your documents.

## Add your own type of processing

OCR aims to provide maximum flexibility to the user because our team understand that all data extraction processes have different requirements. In OCR, you can add your custom processing. Processing here refers to how your data is extracted and then consolidated into a format. You can do this in three steps:

1. In app.py, add a function which accepts parameters files, path where the results needs to be saved and pageCoordinates(if documents are of type PDF)/blockCoordinates(if the documents are images). The function should handle the data consolidation and saving the data in an Excel or whichever format suits best. _Make sure that the function returns a boolean object indicating if the data was saved successfully. For example: If any exception occurs, you can return a False to indicate there was a problem._

 2. Add the name of the processing in the drop down list in index.html.

 3. In app.py, add the a if condition and  in the processRequest function where the if the processing equals your processing, call your function. The function should return a boolean object indicating if the processing and saving was successful.

# Requirements
Python > 3.6<br>
Tesseract

*Note that it is recommended to install your Tesseract-OCR folder(Folder created after installing Tesseract) in your home directory(C://Users//Usernmae). If you already have Tesseract installed, copy the folder to your home directoy or set the pytesseract.pytesseract.tesseract_cmd value in file app.py as the path to your tesseract.exe*

##Python Packages
opencv<br/>
pytesseract<br/>
numpy<br/>
PIL<br/>
pdf2image<br/>
flask<br/>

# Assumptions
1. All the selected documents are of the same type: Image or PDF
2. All the selections made for a page in a PDF will correspond to the same page in rest of the PDFs
3. All the selections made in an image will be corresponding to all the selected images




