MultiPTFToolbar = {

getBookmarksToolbarFolder: function()
{
	return MultiPTF.prefBranch.getCharPref("toolbars.1.folder");
},

getLastVisibleBookmark: function ()
{
  var buttons = document.getElementById("second-bookmarks-ptf");
  var button = buttons.firstChild;
  if (!button)
    return null; // empty bookmarks toolbar
  do
  {
    if (button.collapsed)
      return button.previousSibling;
    button = button.nextSibling;
  } while (button);
  return buttons.lastChild;
},

updateOverflowMenu: function (aMenuPopup)
{
	var hbox = document.getElementById("second-bookmarks-ptf");
	for (var i = 0; i < hbox.childNodes.length; i++) {
		var button = hbox.childNodes[i];
		var menu = aMenuPopup.childNodes[i];
		if (menu.collapsed == button.collapsed)
			menu.collapsed = !menu.collapsed;
	}
},

resizeFunc: function(event) 
{ 
	if (event && event.type == 'focus') 
		window.removeEventListener('focus', MultiPTFToolbar.resizeFunc, false); // hack for bug 266737
	var buttons = document.getElementById("second-bookmarks-ptf");
	if (!buttons)
		return;
	var chevron = document.getElementById("second-bookmarks-chevron");
	var width = window.innerWidth;
	if (width == 0) 
		window.addEventListener('focus', MultiPTFToolbar.resizeFunc, false); // hack for bug 266737
	var myToolbar = buttons.parentNode.parentNode.parentNode;
	for (var i = myToolbar.childNodes.length-1; i >= 0; i--){
		var anItem = myToolbar.childNodes[i];
		if (anItem.id == "second-personal-bookmarks") {
			break;
		}
		width -= anItem.boxObject.width;
	}
	var chevronWidth = 0;
	chevron.collapsed = false;
	chevronWidth = chevron.boxObject.width;
	chevron.collapsed = true;
	var overflowed = false;

	var isLTR=window.getComputedStyle(document.getElementById("PersonalToolbar"),'').direction=='ltr';

	for (var i=0; i<buttons.childNodes.length; i++) {
		var button = buttons.childNodes[i];
		button.collapsed = overflowed;
    
		if (i == buttons.childNodes.length - 1) // last ptf item...
			chevronWidth = 0;
		var offset = isLTR ? button.boxObject.x : width - button.boxObject.x;
		if (offset + button.boxObject.width + chevronWidth > width) {
			overflowed = true;
			// This button doesn't fit. Show it in the menu. Hide it in the toolbar.
			if (!button.collapsed)
				button.collapsed = true;
			if (chevron.collapsed) {
				chevron.collapsed = false;
				var overflowPadder = document.getElementById("second-overflow-padder");
				offset = isLTR ? buttons.boxObject.x : width - buttons.boxObject.x - buttons.boxObject.width;
				overflowPadder.width = width - chevron.boxObject.width - offset;
			}
		}
	}
	MultiPTFRDFObserver._overflowTimerInEffect = false;
},
}
