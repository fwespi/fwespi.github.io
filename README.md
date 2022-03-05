![Image](./src/icons/Icon-96.png)
# Egyptological Unicode Converter
---
> Fabian Wespi

The Egyptological Unicode Converter is a Microsoft Word add-in that converts text in beta code to proper Egyptological, Coptic, and Greek Unicode characters.

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
![Image](./src/icons/TransliterationIcon-96.png) **Transliteration**, \
![Image](./src/icons/Coptic-96.png) **Coptic**, or \
![Image](./src/icons/Greek-96.png) **Greek** \
button in the ribbon in order to convert the beta code into the proper Unicode characters.\
\
Note that a font covering the required Unicode characters must be installed for the characters to be displayed correctly.


--- 

For example, if your input is \
**sXA** \
and you choose the \
![Image](./src/icons/Transliteration-96.png) button, \
**sXA** will be replaced by **sẖꜣ**.

---

### Special rules for Egyptological Transliteration
- Use an exclamation mark to avoid replacement: \
e.g. **a!** → **a**, while **a** → **ꜥ**
- Use an asterix to choose allographs of **ỉ ṯ d ḏ**:\
**i\*** and ** I\***→ **ꞽ** and **Ꞽ** instead of **ỉ** and **Ỉ**\
**T\*** → **č** instead of **ṯ**\
**d\***→ **ṭ** instead of **d**\
**D\*** → **č̣** instead of **ḏ**
- Use the plus sign to make a character uppercase: \
e.g. **X+** → **H̱**, while **X** → **ẖ**

### Special rules for Coptic
- Use the plus sign to make a character uppercase: \
e.g. **D+** → **Ϫ**

### Special rules for Greek
- Greek diacritics are indicated by: \
	- *spiritus lenis*: **)**
	- *spiritus asper*: **(**
	- *acute*: **/**
	- *gravis*: **\\**
	- *circumflex*: **=**
	- *trema*: **+**
	- *iota subscriptum*: **|**

## Character Mapping
### Egyptological transliteration
| from | → | to |
| :----: | :----: | :----: |
| A |  | ꜣ |
| ' |  | ʾ |
| # |  | a |
| i |  | ỉ |
| j |  | i̯ |
| a |  | ꜥ |
| w |  | w |
| b |  | b |
| p |  | p |
| f |  | f |
| m |  | m |
| n |  | n |
| r |  | r |
| l |  | l |
| h |  | h |
| H |  | ḥ |
| x |  | ḫ |
| V |  | h̭ |
| X |  | ẖ |
| s |  | s |
| $ |  | ś |
| S |  | š |
| q |  | ḳ |
| k |  | k |
| g |  | g |
| t |  | t |
| v |  | ṱ |
| T |  | ṯ |
| d |  | d |
| D |  | ḏ |
| = |  | ⸗ |
| & |  | ⸢ |
| \\ |  | ⸣ |

### Coptic
| from | → | to |
| :----: | :----: | :----: |
| a |  | ⲁ |
| b |  | ⲃ |
| g |  | ⲅ |
| d |  | ⲇ |
| e |  | ⲉ |
| Z |  | ⲋ |
| z |  | ⲍ |
| h |  | ⲏ |
| j |  | ⲑ |
| i |  | ⲓ |
| k |  | ⲕ |
| l |  | ⲗ |
| m |  | ⲙ |
| n |  | ⲛ |
| X |  | ⲝ |
| o |  | ⲟ |
| p |  | ⲡ |
| r |  | ⲣ |
| s |  | ⲥ |
| t |  | ⲧ |
| y |  | ⲩ |
| F |  | ⲫ |
| x |  | ⲭ |
| Y |  | ⲯ |
| w |  | ⲱ |
| W |  | ϣ |
| f |  | ϥ |
| H |  | ϩ |
| q |  | ϧ |
| D |  | ϫ |
| K |  | ϭ |
| T |  | ϯ |
| _ |  | ̅ |

### Greek
| from | → | to |
| :----: | :----: | :----: |
| a |  | α |
| b |  | β |
| g |  | γ |
| d |  | δ |
| e |  | ε |
| z |  | ζ |
| h |  | η |
| q |  | θ |
| i |  | ι |
| I |  | Ι |
| k |  | κ |
| l |  | λ |
| m |  | μ |
| n |  | ν |
| c |  | ξ |
| o |  | ο |
| p |  | π |
| r |  | ρ |
| s |  | σ |
| j |  | ς |
| v |  | ϲ |
| t |  | τ |
| u |  | υ |
| f |  | φ |
| x |  | χ |
| y |  | ψ |
| w |  | ω |
| w\* |  | Ꞷ |
| : |  | · |
| ; |  | · |
| ? |  | ; |

---

This project is licensed under the terms of the [*Creative Commons Attribution Share Alike 4.0* (*CC BY-SA 4.0*) licence](https://creativecommons.org/licenses/by-sa/4.0/)
