// Saves options to localStorage.
function saveOptions() {
  saveVariable('trockerEnable', document.getElementById("trockerEnableOpt").checked);
  saveVariable('showTrackerCount', document.getElementById("showTrackerCountOpt").checked);
  saveVariable('anyPage', document.getElementById("anyPageOpt").checked);
  saveVariable('exposeLinks', document.getElementById("exposeLinksOpt").checked);
  saveVariable('verbose', (document.getElementById("verboseOpt").checked && document.getElementById("advancedOpt").checked));
  
	updatePermissionWarnings();
	updateBrowserActionButton();
  
  var oldOpt = loadVariable('advanced');
  saveVariable('advanced', document.getElementById("advancedOpt").checked);
  if (oldOpt!=loadVariable('advanced')) location.reload();
  
  // Update status to let user know options were saved.
  updateStatus('Options were saved!');
}

function updateStatus(innerText, className = '', timeOutMs = 1000){
	var status = document.getElementById("status");
  status.innerText = innerText;
  status.className = className;
  status.style.opacity = 100;
  setTimeout(() => {
    status.style.opacity = 0;
  }, timeOutMs);
}

// Restores select box state to saved value from cache.
function restoreOptions() {
	document.getElementById("trockerEnableOpt").checked = loadVariable('trockerEnable');
	document.getElementById("trockerEnableOpt").onchange = saveOptions;

	document.getElementById("showTrackerCountOpt").checked = loadVariable('showTrackerCount');
	document.getElementById("showTrackerCountOpt").onchange = saveOptions;

	document.getElementById("anyPageOpt").checked = loadVariable('anyPage');
	document.getElementById("anyPageOpt").onchange = saveOptions;

	document.getElementById("exposeLinksOpt").checked = loadVariable('exposeLinks');
	document.getElementById("exposeLinksOpt").onchange = saveOptions;
	
	document.getElementById("verboseOpt").checked = loadVariable('verbose');
	document.getElementById("verboseOpt").onchange = saveOptions;
	
	document.getElementById("advancedOpt").checked = loadVariable('advanced');
	document.getElementById("advancedOpt").onchange = saveOptions;
	
	restoreOptionalPermissions();
	
	// Handle requets to change optional permissions
	// document.getElementById("allUrlsPermission1").onchange = changeOptionalPermission;
	document.getElementById("allUrlsPermission").onchange = changeOptionalPermission;
	document.getElementById("tabsPermission").onchange = changeOptionalPermission;

	// Showing some stats
	// Open Tracker Stats
	var allOpenTrackerBlocks = 0;
	var allOpenTrackerAllows = 0;
	var statsObj = loadVariable('openTrackerStats');
	for (var key in statsObj) {
      if (statsObj.hasOwnProperty(key)) {
        var val = statsObj[key];
		if (!isNaN(val['blocked'])) allOpenTrackerBlocks = allOpenTrackerBlocks + val['blocked'];
		if (!isNaN(val['allowed'])) allOpenTrackerAllows = allOpenTrackerAllows + val['allowed'];
      }
    }
	document.getElementById("blockedOpenTrackers").innerHTML = allOpenTrackerBlocks;
	document.getElementById("allowedOpenTrackers").innerHTML = allOpenTrackerAllows;
	// Click Tracker Stats
	var allClickTrackerBypasses = 0;
	var allClickTrackerAllows = 0;
	var statsObj = loadVariable('clickTrackerStats');
	for (var key in statsObj) {
      if (statsObj.hasOwnProperty(key)) {
        var val = statsObj[key];
		if (!isNaN(val['bypassed'])) allClickTrackerBypasses = allClickTrackerBypasses + val['bypassed'];
		if (!isNaN(val['allowed'])) allClickTrackerAllows = allClickTrackerAllows + val['allowed'];
      }
    }
	document.getElementById("bypassedClickTrackers").innerHTML = allClickTrackerBypasses;
	document.getElementById("allowedClickTrackers").innerHTML = allClickTrackerAllows;
	// Stats start date
	document.getElementById("statsSinceDate").innerHTML = "(Since "+(new Date(loadVariable('statsSinceDate')).toLocaleDateString())+")";
	
	if (loadVariable('advanced')){
		let a = document.getElementsByClassName("advancedItem");
		for (let a0 of a) a0.classList.remove("hidden");
		
		// Extra stats
		if (!document.getElementById("suspDomains")){
			document.getElementById("allowedClickTrackers").parentElement.innerHTML+='<li><span class="stat_name">Suspicious Domains: </span><span class="stat_value" id="suspDomains">Nothing in the log!</span>';
		}
		// Susp Domain List
		suspDomainsObj = loadVariable('suspDomains');
		//document.getElementById("suspDomains").innerHTML = Object.keys(suspDomainsObj).length+'<br />';
		var listHTML = '<div><ol>';
		for (var key in suspDomainsObj) {
			//listHTML += '<li><input type="checkbox" id="removeDomain" src="'+key+'">'+key+' -> '+suspDomainsObj[key].loads+'<br /><ul>';
			listHTML += '<li>'+key+' -> '+suspDomainsObj[key].loads+' times<br /><ul>';
			for (var i=0; i<suspDomainsObj[key].sampleUrls.length; i++) listHTML += '<li>'+suspDomainsObj[key].sampleUrls[i]+'</li>';
			listHTML += '</ul></li>';
		}
		listHTML += '</ol></div>';
		document.getElementById("suspDomains").innerHTML = listHTML;
		//document.getElementById('removeDomain').onchange = removeSuspDomain;
	} else {
		let a = document.getElementsByClassName("advancedItem");
		for (let a0 of a) a0.classList.add("hidden");
		// Extra stats
		var node = document.getElementById("suspDomains");
		if (node) node.parentElement.removeChild(node);
	}
	
	if ( (allOpenTrackerBlocks+allClickTrackerBypasses)>100 ){
		var tweetmsg = '.@trockerapp has blocked '+(allOpenTrackerBlocks+allClickTrackerBypasses)+" trackers in my emails! It's free and opensource! Get it from the chrome web store: https://t.co/ZUB5twChit";
		document.getElementById("spreadtheword").innerHTML = 'So Trocker has blocked '+(allOpenTrackerBlocks+allClickTrackerBypasses)+' trackers in your emails. <a href="https://twitter.com/intent/tweet?text='+tweetmsg+'">Tweet this to spread the word!</a>';	
	}
	
	setTimeout(restoreOptions, 30*1000); // Update stats every few seconds
}

function restoreOptionalPermissions(){
	// Optional permissions check
	chrome.permissions.contains({
		permissions: [],
		origins: ['<all_urls>']
	}, (result) => {
		if (result) {
			// The extension has the permissions.
			hasPermission = true;
		} else {
			// The extension doesn't have the permissions.
			hasPermission = false;
		}
		// For some reason this is sometimes not as reliable as the one based on chrome.permissions.getAll()
		// document.getElementById("allUrlsPermission1").checked = hasPermission;
		// document.getElementById("allUrlsPermission").checked = hasPermission;
		// updatePermissionWarnings();
	});
	chrome.permissions.contains({
		permissions: ['tabs'],
		origins: []
	}, (result) => {
		if (result) {
			// The extension has the permissions.
			hasPermission = true;
		} else {
			// The extension doesn't have the permissions.
			hasPermission = false;
		}
		document.getElementById("tabsPermission").checked = hasPermission;
		updatePermissionWarnings();
	});
	chrome.permissions.getAll(permissions => {
		// Alternative check for <all_urls>
		var hasAllUrlsPermission = permissions.origins.filter(s => s == "<all_urls>").length;
		// document.getElementById("allUrlsPermission1").checked = hasAllUrlsPermission;
		document.getElementById("allUrlsPermission").checked = hasAllUrlsPermission;
		updatePermissionWarnings();
	});
}

function updatePermissionWarnings(){
	if (document.getElementById("allUrlsPermission").checked && document.getElementById("tabsPermission").checked){
		document.getElementById("anyPageWarning").innerText = '(All required permission are granted)'
		document.getElementById("anyPageWarning").className = '';
	} else {
		if (document.getElementById("anyPageOpt").checked) {
			document.getElementById("anyPageWarning").innerText = '(Some required permission are missing (grant from below)!)';
			document.getElementById("anyPageWarning").className = 'warningMsg';
		} else {
			document.getElementById("anyPageWarning").innerText = '';
			document.getElementById("anyPageWarning").className = '';
		}
	}
	if (document.getElementById("allUrlsPermission").checked){
		// document.getElementById("enablePermissionWarning").innerText = '(Permissions required for all features are granted)'
		document.getElementById("enablePermissionWarning").innerText = ''
		document.getElementById("enablePermissionWarning").className = '';
	} else {
		document.getElementById("enablePermissionWarning").innerText = '(Some features will not work because the required permission is missing)';
		document.getElementById("enablePermissionWarning").className = 'warningMsg';
	}
}

function changeOptionalPermission(event){
	// Permissions must be requested from inside a user gesture, like a button's
	// click handler.
	if ((event.target.id === 'allUrlsPermission') || (event.target.id === 'allUrlsPermission1')){
		var permissions = [];
		var origins = ['<all_urls>'];
		var permissionName = '<all_urls>';
	} else if (event.target.id === 'tabsPermission'){
		var permissions = ['tabs'];
		var origins = [];
		var permissionName = 'tabs';
	} else {
		// This should not happen
		return;
	}
	console.log((new Date()).toLocaleString() + ': The user requested a change in optional permissions.');
	if (event.target.checked){
		chrome.permissions.request({
			permissions: permissions,
			origins: origins
		}, (granted) => {
			// The callback argument will be true if the user granted the permissions.
			if (granted) {
				// doSomething();
				updateStatus('Permission for '+permissionName+' was granted.', 'successMsg');
			} else {
				// doSomethingElse();
				console.log((new Date()).toLocaleString() + ': Permission was NOT granted by the user.');
				updateStatus('Permission for '+permissionName+' was NOT granted!');
			}
			restoreOptionalPermissions();
		});
	} else {
		chrome.permissions.remove({
			permissions: permissions,
			origins: origins
		}, (removed) => {
			if (removed) {
				// The permissions have been removed.
				updateStatus('Permission for '+permissionName+' was removed.');
			} else {
				// The permissions have not been removed (e.g., you tried to remove
				// required permissions).
				updateStatus('Permission for '+permissionName+' could not be removed!');
			}
			restoreOptionalPermissions();
		});
	}
}

function removeSuspDomain(key){
	suspDomainsObj = loadVariable('suspDomains');
	//delete thisIsObject[key];
	saveVariable('suspDomains', suspDomainsObj);
}

document.addEventListener('DOMContentLoaded', restoreOptions);