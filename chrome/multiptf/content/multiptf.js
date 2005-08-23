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
