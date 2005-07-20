// Implement nsIRDFObserver so we can update our overflow state when items get
// added/removed from the toolbar
var MultiPTFRDFObserver = {

onAssert: function (aDataSource, aSource, aProperty, aTarget)
{
	this.setOverflowTimeout(aSource, aProperty);
},

onUnassert: function (aDataSource, aSource, aProperty, aTarget)
{
	this.setOverflowTimeout(aSource, aProperty);
},

onChange: function (aDataSource, aSource, aProperty, aOldTarget, aNewTarget)
{
	this.setOverflowTimeout(aSource, aProperty);
},

onMove: function (aDataSource, aOldSource, aNewSource, aProperty, aTarget) {},
onBeginUpdateBatch: function (aDataSource) {},

onEndUpdateBatch: function (aDataSource)
{
	this._overflowTimerInEffect = true;
	setTimeout(MultiPTFToolbar.resizeFunc, 0, null);
},

_overflowTimerInEffect: false,

setOverflowTimeout: function (aSource, aProperty)
{
	if (this._overflowTimerInEffect)
		return;
	if (aProperty.Value == gWEB_NS+"LastModifiedDate")
		return;
	this._overflowTimerInEffect = true;
	setTimeout(MultiPTFToolbar.resizeFunc, 0, null);
}
}

MultiPTFToolbar = {

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

var MultiPTF = {

oldCustomise: null,
prefBranch: null,

init: function()
{
	setTimeout(MultiPTF.delayedInit,5);
},

setFolder: function()
{
	var ptf = document.getElementById("second-bookmarks-ptf");
	if (ptf)
	{
		var btchevron = document.getElementById("second-bookmarks-chevron");
		try
		{
			ptf.ref=MultiPTF.prefBranch.getCharPref("toolbars.1.folder");
			btchevron.ref=ptf.ref;
		}
		catch (ex)
		{
		}
	}
},

initBar: function()
{
	var ptf = document.getElementById("second-bookmarks-ptf");
	if (ptf)
	{
		MultiPTF.setFolder();
		var btchevron = document.getElementById("second-bookmarks-chevron");
		try
		{
			ptf.database.RemoveObserver(MultiPTFRDFObserver);
			ptf.controllers.removeController(BookmarksMenuController);
		}
		catch (ex)
		{
		}
	    ptf.database.AddObserver(MultiPTFRDFObserver);
		ptf.controllers.appendController(BookmarksMenuController);
		ptf.builder.rebuild();
		btchevron.builder.rebuild();
		window.addEventListener("resize", MultiPTFToolbar.resizeFunc, false);
		BookmarksToolbar.resizeFunc(null);
	}
},

customised: function(aToolboxChanged)
{
	MultiPTF.oldCustomise(aToolboxChanged);
	MultiPTF.initBar();
},

prefChange: function(pref)
{
	if (pref=="toolbars.1.folder")
	{
		MultiPTF.setFolder();
	}
},

observe: function(prefBranch, subject, pref)
{
	MultiPTF.prefChange(pref);
},

delayedInit: function()
{
	MultiPTF.prefBranch = Components.classes['@mozilla.org/preferences-service;1']
							.getService(Components.interfaces.nsIPrefService).getBranch("multiptf.")
							.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
	MultiPTF.prefBranch.addObserver("",MultiPTF,false);

	MultiPTF.initBar();
	var toolbox = document.getElementById("navigator-toolbox");
	MultiPTF.oldCustomise = toolbox.customizeDone;
	toolbox.customizeDone = MultiPTF.customised;
}
}

window.addEventListener("load",MultiPTF.init,false);
