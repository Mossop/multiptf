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
	var myToolbarItem = buttons.parentNode.parentNode;
	
	var width = myToolbarItem.boxObject.width;
	if (width <= 0) { // hack for bug 266737
		window.addEventListener('focus', MultiPTFToolbar.resizeFunc, false);
		return;
	}
	var chevronWidth = 0;
	chevron.collapsed = false;
	chevronWidth = chevron.boxObject.width;
	chevron.collapsed = true;
	var overflowed = false;

  var usedWidth = 3;
	for (var i=0; i<buttons.childNodes.length; i++) {
		var button = buttons.childNodes[i];
		button.collapsed = overflowed;
    
		if (i == buttons.childNodes.length - 1) // last ptf item...
			chevronWidth = 0;
		if (usedWidth + button.boxObject.width + chevronWidth > width) {
			overflowed = true;
			// This button doesn't fit. Show it in the menu. Hide it in the toolbar.
			if (!button.collapsed)
				button.collapsed = true;
			if (chevron.collapsed) {
				chevron.collapsed = false;
				var overflowPadder = document.getElementById("second-overflow-padder");
				overflowPadder.width = width - chevron.boxObject.width;
			}
		}
		usedWidth += button.boxObject.width;
	}
	MultiPTFRDFObserver._overflowTimerInEffect = false;
},
}
