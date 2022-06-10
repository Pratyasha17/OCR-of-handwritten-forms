import os
import shutil
import pandas as pd
import cv2.cv2 as c
from PIL import Image
import pytesseract
import numpy as np
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS, cross_origin
from pdf2image import convert_from_path


#Please ensure that Tesseract_OCR Folder is installed in the homedirectory/userDirectory. If you already have tesseract
#installed then either set tessearch_cmd to that directory or copy the Tessearct_OCR folder to home directory
homeDirectory = os.path.expanduser('~')
pytesseract.pytesseract.tesseract_cmd = os.path.join(homeDirectory, 'Tesseract-OCR', "tesseract.exe")

app = Flask(__name__)
app.config.from_object(__name__)
app.config['UPLOAD_FOLDER'] = 'static/js/uploads'
# enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
global files, is_pdf, ocrPage, img
files = []
is_pdf = False
ocrPage = 1
def delete_folder(path):
    if os.path.exists(path):
        shutil.rmtree(path)


def create_folder(path):
    print(f"Creating Folder - {path}")
    if not os.path.exists(path):
        os.makedirs(path)


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/add_numbers', methods=['POST'])
@cross_origin(supports_credentials=True)
def add_numbers():
    a = int(request.json.get('a', -10))
    b = int(request.json.get('b', -10))
    return jsonify({'result': a + b})


@app.route('/updatePage', methods=['POST'])
def update_page():
    global ocrPage, img
    ocrPage = request.json['currentPage']
    path = os.path.join(app.config['UPLOAD_FOLDER'], str(ocrPage) + '.jpg')
    img = c.imread(path, 0)
    return jsonify({})


@app.route('/ocr', methods=['POST'])
def get_ocr_text():
    global ocrPage, img
    print('Image width and height', img.shape[1], img.shape[0])
    try:
        width, height = request.json['width'], request.json['height']
        x, y = int(request.json['x']), int(request.json['y'])
        gray_image = img[y: y + height, x: x + width]
        gray_image = Image.fromarray(gray_image)
        print(x,y, width, height)
        text = pytesseract.image_to_string(gray_image)
        print(text)
        return jsonify({'result': text})
    except Exception as e:
        print(e)
        return jsonify({'result': "Something went wrong"})


def imageGenericProcess(coordinates, files, savePath):
    """
    Extract text from the given coordinates and return a 2D list, with each row/list belonging to data related to each file
    :param savePath: Path to the file where the data is to be saved
    :param coordinates: list of dictionaries with keys (x, y, width, height)
    :param files: Files in the folder entered in the path field textbox(front end)
    :return: A 2D list compatible for creating a Pandas DataFrame
    """
    print(coordinates)
    data = []
    try:
        for file in files:
            print(f'Processing - {file}')
            image = c.imread(file, 0)
            temp = {'file': os.path.basename(file)}
            for i, coords in enumerate(coordinates, 1):
                x, y, width, height = coords['x'], coords['y'], coords['width'], coords['height']
                gray_image = image[y: y + height, x: x + width]
                gray_image = Image.fromarray(gray_image)
                text = pytesseract.image_to_string(gray_image)
                try:
                    temp[coords['colName']] = text
                except KeyError as k:
                    print('The colName field was not added')
                    temp[f'Columns {i}'] = text
            data.append(temp)
        pd.DataFrame(data).to_excel(savePath, index=False)
    except Exception as e:
        print(e)
        return False
    return True


def pdfGenericProcess(pageCoorinates, files, savePath):
    """
    Extract text from the given coordinates and return a 2D list, with each row/list belonging to data related to
    each page of a particular file. Data of all pages from each file will be added to this 2D list. :param
    pageCoorinates: A dictionary with keys as pagenumbers and values as a list of dictionaries :param files: Files in
    the folder entered in the path field textbox(front end) :return: A 2D list compatible for creating a Pandas
    DataFrame
    """
    print(pageCoorinates)
    data = []
    try:
        for file in files:
            print(f'Processing {file}')
            try:
                images = convert_from_path(os.path.join(app.config['UPLOAD_FOLDER'], file), poppler_path=r'poppler-0'
                                                                                                         r'.51\bin')
            except Exception as e:
                print(e)
                print('Problem Converting PDF to Image. Please check this line in a separate script')

            for i, image in enumerate(images, 1):
                image = np.array(image)
                # page_data = [f'Page {i}']
                page_data = {'Page': i}
                try:
                    currentCoordinates = pageCoorinates[str(i)]
                except KeyError:
                    continue
                for coords in currentCoordinates:
                    x, y, width, height = coords['x'], coords['y'], coords['width'], coords['height']
                    img = image[y: y + height, x: x + width]
                    # gray_image = Image.fromarray(gray_image)
                    print(x, y, width, height)
                    text = pytesseract.image_to_string(img)
                    print(text)
                    # page_data.append(text)
                    try:
                        page_data[coords['colName']] = text
                    except KeyError as k:
                        print('The colName field was not added')
                        page_data[f'Columns {i}'] = text

                page_data['file'] = os.path.basename(file)
                data.append(page_data)
        print(data)
        pd.DataFrame(data).to_excel(savePath, index=False)
    except Exception as e:
        print(e)
        return False
    return True


def currencyProcessing(pageCoordinates, pdfs, saveFolder):
    """
    Extracts data with respect to each page mentioned in pageCoordinates. Assumes each page with two blocks, one for
    dates and for currency value.
    :param saveFolder: Folder where the data is to be saved
    :param pageCoordinates: A dictionary with keys as pagenumbers and values as a list of dictionaries
    :param pdfs: Files in the folder entered in the path field textbox(front end)
    :return:
    """

    data = {}
    try:
        for pdf in pdfs:
            pdf_data = []
            print(pdf)
            try:
                images = convert_from_path(pdf, poppler_path=r'poppler-0.51\bin')
            except Exception as e:
                print(e)
                print('Problem Converting PDF to Image. Please check this line in a separate script')
                return False
            for i, image in enumerate(images, 1):
                image = np.array(image)
                print(f'Extracting text from Page {i}')
                page_data = []
                try:
                    currentCoordinates = pageCoordinates[str(i)]
                except KeyError:
                    continue
                for coords in currentCoordinates:
                    try:
                        x, y, width, height = coords['x'], coords['y'], coords['width'], \
                                              coords['height']
                    except KeyError:
                        continue
                    im = image[y: y + height, x: x + width]
                    im = Image.fromarray(im)
                    text = pytesseract.image_to_string(im)
                    text = text.replace('\n\n','\n')
                    page_data.append(text.split('\n'))
                pdf_data.extend(list(zip(*page_data)))
            data[os.path.basename(pdf)] = pdf_data
        for key, value in data.items():
            path = os.path.join(saveFolder, f'{key}.xlsx')
            pd.DataFrame(value).to_excel(path, index=False)
    except Exception as e:
        print(e)
        return False
    return True


@app.route('/submit', methods=['POST'])
def processRequest():
    """
    Execute the relevant processing based on saveFolder parameter from the request object. Save the returned list to
    Excel(s) using a DataFrame. :return:
    """
    global files
    processing = request.json['processing']
    saveFolder = request.json['saveFolder']
    print(saveFolder)
    try:
        create_folder(saveFolder)
    except TypeError:
        saveFolder = ''
    result = False
    print(f'Processing - {processing}')
    if processing == "Image Processing":
        path = os.path.join(saveFolder, 'Results.xlsx')
        result = imageGenericProcess(coordinates=request.json['coordinateData'], files=files, savePath=path)
        print(result)

    elif processing == "PDF Processing":
        path = os.path.join(saveFolder, 'Results.xlsx')
        result = pdfGenericProcess(pageCoorinates=request.json['pageCoordinates'], files=files, savePath=path)
        print(result)

    elif processing == "Currency PDF documents":
        result = currencyProcessing(request.json['pageCoordinates'], files, saveFolder)
        print(result)

    delete_folder(os.path.join(app.config['UPLOAD_FOLDER']))
    if result:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False})



def convertPDFtoImagesInUploads():
    """
    Convert pdf in the static/js/upload folder to images (jpgs) and returns the number of pages
    :return:
    """
    file = os.listdir(app.config['UPLOAD_FOLDER'])
    images = convert_from_path(os.path.join(app.config['UPLOAD_FOLDER'], file[0]), poppler_path=r'poppler-0.51\bin')
    for index, image in enumerate(images, 1):
        print(f'Saving page {index} to')

        print(os.path.join(app.config['UPLOAD_FOLDER'], f'{str(index)}.jpg'))
        c.imwrite(os.path.join(app.config['UPLOAD_FOLDER'], f'{str(index)}.jpg'), np.array(image))
    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file[0]))
    return len(images)


def copyToUploads(file, filename='1', extension='.jpg'):
    os.rename(os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(file)),
              os.path.join(app.config['UPLOAD_FOLDER'], filename + extension));


@app.route('/upload', methods=['POST'])
def selectFiles():
    """
    Upload all the files in path key of request object to static/js/uploads and return an object with total pages and
    if the documents are PDF :return:
    """
    ocrPage=1
    global files, is_pdf, img
    path = request.json['path']
    files = [os.path.join(path, file) for file in os.listdir(path)]
    delete_folder(app.config['UPLOAD_FOLDER'])
    create_folder(app.config['UPLOAD_FOLDER'])
    file = files[0]
    shutil.copy(file, app.config['UPLOAD_FOLDER'])

    if file.endswith('.pdf'):
        is_pdf = True
        page_count = convertPDFtoImagesInUploads()
    else:
        copyToUploads(file)
        print(f"Basename - {os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(file))} to", end=' --> ')
        print(os.path.join(app.config['UPLOAD_FOLDER'], '1.jpg'))
        page_count = 0
        is_pdf = False

    img = c.imread(os.path.join(app.config['UPLOAD_FOLDER'], str(ocrPage) + '.jpg'), 0)
    print(f'First Image - Image width and height {img.shape[1]}, {img.shape[0]}')
    return jsonify({'isPDF': is_pdf, 'page_count': page_count})


if __name__ == '__main__':
  #  delete_folder(os.path.join(app.config['UPLOAD_FOLDER']))
    app.run(threaded=True, debug=True, port=5001)
