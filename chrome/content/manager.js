var MultiPTFManager = {

multiptfMenu: null,

init: function()
{
	var menuitem = document.getElementById("menu_selectAll");
	while ((menuitem)&&(menuitem.getAttribute("command")!="cmd_bm_setpersonaltoolbarfolder"))
	{
		menuitem=menuitem.nextSibling;
	}
	var pos = 0;
	var menupopup=menuitem.parentNode;
	if (menuitem)
	{
		menuitem=menuitem.nextSibling;
	}
	var newitem = document.createElement("menuitem");
	if (menuitem)
	{
		menupopup.insertBefore(newitem,menuitem);
	}
	else
	{
		menupopup.appendChild(newitem);
	}
	newitem.setAttribute("label","Set as Second Bookmarks Toolbar");
	newitem.addEventListener("command",MultiPTFManager.setToolbar,false);
	MultiPTFManager.multiptfMenu=newitem;
	menupopup.addEventListener("popupshowing",MultiPTFManager.setMenuState,false);
},

getCurrentSelection: function()
{
	var focused = document.commandDispatcher.focusedElement;
	if (focused.tagName=="tree")
	{
		var tree = focused.parentNode;
		while ((tree)&&(tree.tagName!="bookmarks-tree"))
		{
			tree=tree.parentNode;
		}
		if (tree)
		{
			return tree.getTreeSelection();
		}
	}
	return null;
},

isValidToolbar: function(selection)
{
	if (selection.length!=1)
	{
		return false;
	}
	if ((selection.type[0]!="Folder")&&(selection.type[0]!="PersonalToolbarFolder"))
	{
		return false;
	}
	return true;
},

setMenuState: function(event)
{
	var selection = MultiPTFManager.getCurrentSelection();
	
	if (selection)
	{
		if (MultiPTFManager.isValidToolbar(selection))
		{
			MultiPTFManager.multiptfMenu.setAttribute("disabled","false");
		}
		else
		{
			MultiPTFManager.multiptfMenu.setAttribute("disabled","true");
		}
	}
	else
	{
		MultiPTFManager.multiptfMenu.setAttribute("disabled","true");
	}
},

setToolbar: function(event)
{
	var selection = MultiPTFManager.getCurrentSelection();
	if ((selection)&&(MultiPTFManager.isValidToolbar(selection)))
	{
		var folder = selection.item[0].Value;
		var prefs = Components.classes['@mozilla.org/preferences-service;1']
							.getService(Components.interfaces.nsIPrefService).getBranch("multiptf.")
							.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		prefs.setCharPref("toolbars.1.folder",folder);
	}
}

}

window.addEventListener("load",MultiPTFManager.init,false);
