![Image](./src/icons/Icon-96.png)
# Egyptological Unicode Converter

> Fabian Wespi

The Egyptological Unicode Converter is a Microsoft Word add-in that converts text in beta code to proper Egyptological, Hieroglyphic, Coptic, and Greek Unicode characters.

## Supported platforms
- Office 2019 or later

## Installation
1) Download *EgyptologicalUnicodeConverter.xml*.
2) In Word, navigate to **File** > **Options**.
3) Choose **Trust Center**, and then **Trust Center Settings**.
4) Choose **Trusted Add-in Catalogs**.
5) In the **Catalog Url** box, enter the path (starting with "*\\localhost\C$\\*") to the folder that contains the xml-file and click the **Add catalog** button.
6) Select the **Show in Menu** check box and the choose **OK** and close the **Options** dialog window.

7) Navigate to the **Insert** tab of the ribbon and choose select **My Add-ins**.
8) Choose **SHARED FOLDER**.
9) Choose the add-in and click **Add** to insert it.

## How to use
1) In Word, select some text written in Egyptological, Coptic, or Greek beta code.
2) Choose either the \
<img src="./src/icons/Transcription-80.png" height="20"/> **Transcription**, \
<img src="./src/icons/HieroLTR-80.png" height="20"/> **Hieroglyphs**, \
<img src="./src/icons/Coptic-80.png" height="20"/> **Coptic**, or \
<img src="./src/icons/Greek-80.png" height="20"/> **Greek** \
button in the ribbon in order to convert the beta code into the proper Unicode characters.\
\
For further information choose the \
<img src="./src/icons/Icon-80.png" height="20"/> **Info** \
button in the ribbon.

--- 

For example, if your input is 
**sXA** 
and you choose the 
<img src="./src/icons/Transcription-80.png" height="20"/> button, 
**sXA** will be replaced by **sẖꜣ**.

---

This project is licensed under the terms of the [*Creative Commons Attribution Share Alike 4.0* (*CC BY-SA 4.0*) licence](https://creativecommons.org/licenses/by-sa/4.0/)
