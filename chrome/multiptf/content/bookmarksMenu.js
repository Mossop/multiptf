var MultiPTFMenu = {
  _selection:null,
  _target:null,
  _orientation:null,

  /////////////////////////////////////////////////////////////////////////////
  // prepare the bookmarks menu for display
  onShowMenu: function (aTarget)
  {
    this.showOpenInTabsMenuItem(aTarget);
    this.showEmptyItem(aTarget);
  },

  /////////////////////////////////////////////////////////////////////////////
  // remove arbitary elements created in this.onShowMenu()
  onHideMenu: function (aTarget)
  {
    this.hideOpenInTabsMenuItem(aTarget);
    this.hideEmptyItem(aTarget);
  },

  /////////////////////////////////////////////////////////////////////////////
  // shows the 'Open in Tabs' menu item if validOpenInTabsMenuItem is true -->
  showOpenInTabsMenuItem: function (aTarget)
  {
    if (!this.validOpenInTabsMenuItem(aTarget) ||
        aTarget.lastChild.getAttribute("class") == "openintabs-menuitem")
      return;
    var element = document.createElementNS(gXUL_NS, "menuseparator");
    element.setAttribute("class", "openintabs-menuseparator");
    aTarget.appendChild(element);
    element = document.createElementNS(gXUL_NS, "menuitem");
    element.setAttribute("class", "openintabs-menuitem");
    element.setAttribute("label", BookmarksUtils.getLocaleString("cmd_bm_openfolder"));
    element.setAttribute("accesskey", BookmarksUtils.getLocaleString("cmd_bm_openfolder_accesskey"));
    aTarget.appendChild(element);
  },

  realHideOpenInTabsMenuItem: function (aParent)
  {
    if (!aParent.hasChildNodes())
      return;
    var child = aParent.lastChild;
    var removed = 0;
    while (child) {
      var cclass = child.getAttribute("class");
      if (cclass == "openintabs-menuitem" || cclass == "openintabs-menuseparator") {
        var prevchild = child.previousSibling;
        aParent.removeChild(child);
        child = prevchild;
        removed++;
        if (removed == 2)
          break;
      } else {
        child = child.previousSibling;
      }
    }
  },

  hideOpenInTabsMenuItem: function (aTarget)
  {
    setTimeout(function() { BookmarksMenu.realHideOpenInTabsMenuItem(aTarget); }, 0);
  },

  /////////////////////////////////////////////////////////////////////////////
  // returns false if...
  // - the parent is the bookmark menu or the chevron
  // - the menupopup contains ony one bookmark
  validOpenInTabsMenuItem: function (aTarget)
  {
    var rParent = RDF.GetResource(aTarget.parentNode.id)
    var type = BookmarksUtils.resolveType(rParent);
    if (type != "Folder" && type != "PersonalToolbarFolder" && type != "Livemark")
      return false;
    var count = 0;
    if (!aTarget.hasChildNodes())
      return false;
    var curr = aTarget.firstChild;
    do {
      type = BookmarksUtils.resolveType(curr.id);
      if (type == "Bookmark" && ++count == 2)
        return true;
      curr = curr.nextSibling;
    } while (curr);
    return false;
  },

  /////////////////////////////////////////////////////////////////////////////
  // show an empty item if the menu is empty
  showEmptyItem: function (aTarget)
  {
    if(aTarget.hasChildNodes())
      return;

    var EmptyMsg = BookmarksUtils.getLocaleString("emptyFolder");
    var emptyElement = document.createElementNS(gXUL_NS, "menuitem");
    emptyElement.setAttribute("id", "empty-menuitem");
    emptyElement.setAttribute("label", EmptyMsg);
    emptyElement.setAttribute("disabled", "true");

    aTarget.appendChild(emptyElement);
  },

  /////////////////////////////////////////////////////////////////////////////
  // remove the empty element
  hideEmptyItem: function (aTarget)
  {
    if (!aTarget.hasChildNodes())
      return;

    // if the user drags to the menu while it's open (i.e. on the toolbar),
    // the bookmark gets added either before or after the Empty menu item
    // before the menu is hidden.  So we need to test both first and last.
    if (aTarget.firstChild.id == "empty-menuitem")
      aTarget.removeChild(aTarget.firstChild);
    else if (aTarget.lastChild.id == "empty-menuitem")
      aTarget.removeChild(aTarget.lastChild);
  },

  //////////////////////////////////////////////////////////////////////////
  // Fill a context menu popup with menuitems appropriate for the current
  // selection.
  createContextMenu: function (aEvent)
  {
    var target = document.popupNode;

    if (!this.isBTBookmark(target.id)) {
      target.removeAttribute("open");
      return false;
    }

    var targettype = BookmarksUtils.resolveType(target.id);

    if (targettype == "ImmutableFolder") {
      // no context; see bug#... (popups getting stuck because "open"
      // attribute doesn't get removed)
      target.removeAttribute("open");
      return false;
    }

    var bt = document.getElementById("second-bookmarks-ptf");
    bt.focus(); // buttons in the bt have -moz-user-focus: ignore

    this._selection   = this.getBTSelection(target);
    this._orientation = this.getBTOrientation(aEvent, target);
    if (targettype != "ImmutableBookmark")
      this._target = this.getBTTarget(target, this._orientation);

    // walk up the tree until we find a database node
    var p = target;
    while (p && !p.database)
      p = p.parentNode;
    if (p)
      this._db = p.database;

    BookmarksCommand.createContextMenu(aEvent, this._selection, this._db);
    this.onCommandUpdate();
    aEvent.target.addEventListener("mousemove", BookmarksMenuController.onMouseMove, false);
    return true;
  },

  /////////////////////////////////////////////////////////////////////////
  // Clean up after closing the context menu popup
  destroyContextMenu: function (aEvent)
  {
    if (content)
      content.focus();
    // XXXpch: see bug 210910, it should be done properly in the backend
    BookmarksMenuDNDObserver.mCurrentDragOverTarget = null;
    BookmarksMenuDNDObserver.onDragCloseTarget();

    BookmarksMenuDNDObserver.onDragRemoveFeedBack(document.popupNode);

    aEvent.target.removeEventListener("mousemove", BookmarksMenuController.onMouseMove, false)
  },

  /////////////////////////////////////////////////////////////////////////////
  // returns the formatted selection from aNode
  getBTSelection: function (aNode)
  {
    var item;
    switch (aNode.id) {
    case "bookmarks-ptf":
      item = MultiPTFToolbar.getBookmarksToolbarFolder();
      break;
    case "bookmarks-menu":
      item = "NC:BookmarksRoot";
      break;
    default:
      item = aNode.id;
      if (!this.isBTBookmark(item))
        return {length:0};
    }
    var parent           = this.getBTContainer(aNode);
    var isExpanded       = aNode.hasAttribute("open") && aNode.open;
    var selection        = {};
    selection.item       = [RDF.GetResource(item)];
    selection.parent     = [RDF.GetResource(parent)];
    selection.isExpanded = [isExpanded];
    selection.length     = selection.item.length;
    BookmarksUtils.checkSelection(selection);
    return selection;
  },

  /////////////////////////////////////////////////////////////////////////
  // returns the insertion target from aNode
  getBTTarget: function (aNode, aOrientation)
  {
    var item, parent, index;
    switch (aNode.id) {
    case "second-bookmarks-ptf":
      parent = MultiPTFToolbar.getBookmarksToolbarFolder();
      item = MultiPTFToolbar.getLastVisibleBookmark();
      break;
    case "bookmarks-menu":
      parent = "NC:BookmarksRoot";
      break;
    case "second-bookmarks-chevron":
      parent = MultiPTFToolbar.getBookmarksToolbarFolder();
      break;
    default:
      if (aOrientation == BookmarksUtils.DROP_ON)
        parent = aNode.id
      else {
        parent = this.getBTContainer(aNode);
        item = aNode;
      }
    }

    parent = RDF.GetResource(parent);
    if (aOrientation == BookmarksUtils.DROP_ON)
      return BookmarksUtils.getTargetFromFolder(parent);
      
    item = RDF.GetResource(item.id);
    RDFC.Init(BMDS, parent);
    index = RDFC.IndexOf(item);
    if (aOrientation == BookmarksUtils.DROP_AFTER)
      ++index;

    return { parent: parent, index: index };
  },

  /////////////////////////////////////////////////////////////////////////
  // returns the parent resource of a node in the personal toolbar.
  // this is determined by inspecting the source element and walking up the 
  // DOM tree to find the appropriate containing node.
  getBTContainer: function (aNode)
  {
    var parent;
    var item = aNode.id;
    if (!this.isBTBookmark(item))
      return "NC:BookmarksRoot"
    parent = aNode.parentNode.parentNode;
    parent = parent.id;
    switch (parent) {
    case "second-bookmarks-chevron":
    case "second-bookmarks-stack":
    case "second-bookmarks-toolbar":
      return MultiPTFToolbar.getBookmarksToolbarFolder();
    case "bookmarks-menu":
      return "NC:BookmarksRoot";
    default:
      return parent;
    }
  },

  ///////////////////////////////////////////////////////////////////////////
  // returns true if the node is a bookmark, a folder or a bookmark separator
  isBTBookmark: function (aURI)
  {
    if (!aURI)
      return false;
    var type = BookmarksUtils.resolveType(aURI);
    return (type == "BookmarkSeparator"     ||
            type == "Bookmark"              ||
            type == "Folder"                ||
            type == "PersonalToolbarFolder" ||
            type == "Livemark"              ||
            type == "ImmutableBookmark"     ||
            type == "ImmutableFolder"       ||
            aURI == "second-bookmarks-ptf")
  },

  /////////////////////////////////////////////////////////////////////////
  // returns true if the node is a container. -->
  isBTContainer: function (aTarget)
  {
    return  aTarget.localName == "menu" || (aTarget.localName == "toolbarbutton" &&
           (aTarget.getAttribute("container") == "true"));
  },

  /////////////////////////////////////////////////////////////////////////
  // returns BookmarksUtils.DROP_BEFORE, DROP_ON or DROP_AFTER accordingly
  // to the event coordinates. Skin authors could break us, we'll cross that 
  // bridge when they turn us 90degrees.  -->
  getBTOrientation: function (aEvent, aTarget)
  {
    var target
    if (!aTarget)
      target = aEvent.target;
    else
      target = aTarget;
    if (target.localName == "menu"                 &&
        target.parentNode.localName != "menupopup" ||
        target.id == "second-bookmarks-chevron")
      return BookmarksUtils.DROP_ON;
    if (target.id == "second-bookmarks-ptf") {
      return target.hasChildNodes()?
             BookmarksUtils.DROP_AFTER:BookmarksUtils.DROP_ON;
    }

    var overButtonBoxObject = target.boxObject.QueryInterface(Components.interfaces.nsIBoxObject);
    var overParentBoxObject = target.parentNode.boxObject.QueryInterface(Components.interfaces.nsIBoxObject);

    var size, border;
    var coordValue, clientCoordValue;
    switch (target.localName) {
      case "toolbarseparator":
      case "toolbarbutton":
        size = overButtonBoxObject.width;
        coordValue = overButtonBoxObject.x;
        clientCoordValue = aEvent.clientX;
        break;
      case "menuseparator": 
      case "menu":
      case "menuitem":
        size = overButtonBoxObject.height;
        coordValue = overButtonBoxObject.screenY;
        clientCoordValue = aEvent.screenY;
        break;
      default: return BookmarksUtils.DROP_ON;
    }
    if (this.isBTContainer(target))
      if (target.localName == "toolbarbutton") {
        // the DROP_BEFORE area excludes the label
        var iconNode = document.getAnonymousElementByAttribute(target, "class", "toolbarbutton-icon");
        border = parseInt(document.defaultView.getComputedStyle(target,"").getPropertyValue("padding-left")) +
                 parseInt(document.defaultView.getComputedStyle(iconNode     ,"").getPropertyValue("width"));
        border = Math.min(size/5,Math.max(border,4));
      } else
        border = size/5;
    else
      border = size/2;

    // in the first region?
    if (clientCoordValue-coordValue < border)
      return BookmarksUtils.DROP_BEFORE;
    // in the last region?
    else if (clientCoordValue-coordValue >= size-border)
      return BookmarksUtils.DROP_AFTER;
    else // must be in the middle somewhere
      return BookmarksUtils.DROP_ON;
  },

  /////////////////////////////////////////////////////////////////////////
  // expand the folder targeted by the context menu.
  expandBTFolder: function ()
  {
    var target = document.popupNode.lastChild;
    if (document.popupNode.open)
      target.hidePopup();
    else
      target.showPopup(document.popupNode);
  },

  onCommandUpdate: function ()
  {
    var selection = this._selection;
    var target    = this._target;
    BookmarksController.onCommandUpdate(selection, target);
    if (document.popupNode.id == "second-bookmarks-ptf") {
      // disabling 'cut' and 'copy' on the empty area of the personal toolbar
      var commandNode = document.getElementById("cmd_cut");
      commandNode.setAttribute("disabled", "true");
      commandNode = document.getElementById("cmd_copy");
      commandNode.setAttribute("disabled", "true");
    }
  },

  ///////////////////////////////////////////////////////////////
  // Load a bookmark in menus or toolbar buttons
  // aTarget may not the aEvent target (see Open in tabs command)
  loadBookmark: function (aEvent, aTarget, aDS)
  {
    if (aTarget.getAttribute("class") == "openintabs-menuitem")
      aTarget = aTarget.parentNode.parentNode;
      
    // Check for invalid bookmarks (most likely a static menu item like "Manage Bookmarks")
    if (!this.isBTBookmark(aTarget.id))
      return;
    var rSource   = RDF.GetResource(aTarget.id);
    var selection = BookmarksUtils.getSelectionFromResource(rSource);
    var browserTarget = whereToOpenLink(aEvent);
    BookmarksCommand.openBookmark(selection, browserTarget, aDS);
    aEvent.preventBubble();
  },

  ////////////////////////////////////////////////
  // loads a bookmark with the mouse middle button
  loadBookmarkMiddleClick: function (aEvent, aDS)
  {
    if (aEvent.button != 1)
      return;
    // unlike for command events, we have to close the menus manually
    BookmarksMenuDNDObserver.mCurrentDragOverTarget = null;
    BookmarksMenuDNDObserver.onDragCloseTarget();
    this.loadBookmark(aEvent, aEvent.target, aDS);
  }
}
