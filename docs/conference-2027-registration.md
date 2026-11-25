# 2027 conference: registration launch

The pinned top announcement was removed. For the save-the-date phase, use the homepage carousel and featured Events listing.

When registration opens, enable the saved centered popup (option 2):

- Template: `html/components/conference-registration-popup.html`.
- Styles: `css/conference-registration-popup.css` (currently not loaded).
- Replace “Save the Date!” and the coming-soon paragraph with approved registration announcement text.
- Replace the details link with the confirmed registration link; update the poster if a registration graphic is available.
- Load the template through the existing component loader so relative image and page links are adjusted for each page depth.
- Open with `showModal()`. Wire × and Escape to close it, restore focus, and remember dismissal with a new registration-specific storage key.
- Keep it hidden on the conference page and after the event. Check keyboard navigation and mobile layout before enabling.

The saved template is inactive: i will not display it until registration is confirmed open.
