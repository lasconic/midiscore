(function( $ ) {
	var C = "mpager";
	$.fn.mpager = function(options){
		var el = this.eq(0).data(C);
		var opts = $.extend({}, $.fn.mpager.defaults, options);
		this.each(function(){
            el = new $mpager(this, opts);
        });
        return opts.api ? el : null;
	};
	$.mpager = function(e, opts){
		this.e = $(e);
		this.pages = opts.pages;
		this.scoreId = opts.scoreId;
		this.scoreSecret = opts.scoreSecret;
		this.scoreChanged = opts.scoreChanged;
		this.apiServer = opts.apiServer;
		this.staticBucket = opts.staticBucket;
		this.pageWidth = opts.pageWidth;
		this.scrollTopMargin = opts.scrollTopMargin;
		this.measureClickCallback = opts.measureClickCallback;
		this.measureChangeCallback = opts.measureChangeCallback;
		this.pageChangeCallback = opts.pageChangeCallback;
		this.bottomPadding = opts.bottomPadding;
		this.scrollToMeasure = opts.scrollToMeasure;
		
		this.cMeasure = opts.defaultMeasure;
		this.cPage = 0;
		
		this.omitFirstPage = opts.omitFirstPage;
		
		this.consumerKey = opts.consumerKey;
		
		this.factor = 12;
    
    this.NORMAL_VIEW = 0;
    this.SLIDESHOW_VIEW = 1;
    this.cMode = this.SLIDESHOW_VIEW;
		this._init();
	};
	
	$.fn.mpager.defaults = {
			api: false,
			pages: 1,
			scoreId : null,
			scoreSecret : null,
			scoreChanged : null,
			apiServer : "http://api.musescore.com",
			staticBucket : "static.musescore.com",
			measureClickCallback : null,
			measureChangeCallback: null,
			pageChangeCallback: null,
			pageWidth: 0,
			scrollTopMargin : 120,
			defaultMeasure : -1,
			bottomPadding: 0,
			scrollToMeasure: false,
			omitFirstPage: false,
			consumerKey: "your-oauth-consumer-key",
			};
	
	var $mpager = $.mpager;
    $mpager.fn = $mpager.prototype = {
    		mpager: '1.2'
    };
    $mpager.fn.extend = $mpager.extend = $.extend;
    $mpager.fn.extend({
        _init: function(){
            var self = this;
            
            this.maxPageWidth = this.e.width() - 2;
            var scaling = this.pageWidth / this.maxPageWidth;
            var change = (!this.scoreChanged ? '' : '?no-cache='+this.scoreChanged );
            for ( var i = ( this.omitFirstPage? 1: 0 ); i < self.pages; i++) {
    			       this.e.append('<div id="page-' + i + '" class="mpager-page"><img id="pageimg-' + i + '" class="pageimg" src="http://' + this.staticBucket + '/' + this.scoreId + '/' + this.scoreSecret + '/score_' + i + '.png'+change+'"/></div>');
    		    }  
    		
        		$(".pageimg").width(this.maxPageWidth);
        		
            this.processSwitchToView(this.cMode);
        		
            $.getJSON(this.apiServer + "/services/rest/score/" + this.scoreId + "/space.jsonp?secret=" + this.scoreSecret + "&oauth_consumer_key="+ this.consumerKey +"&callback=?", function(data) {
        			self.elements = data;
        			self.measureCount = data.length;
        			self.pageArray = new Array();
        			for ( var i = 0; i < self.measureCount; i++) {
        				var page = data[i].page;
        				if(!self.pageArray[page])
        					   self.pageArray[page] = new Array();
        				self.pageArray[page].push(data[i]);
        				
        				var x = Math.floor(parseInt(self.elements[i].x) / (self.factor*scaling));
        				var y = Math.floor(parseInt(self.elements[i].y) / (self.factor*scaling));
        				var width = Math.round(parseInt(self.elements[i].sx) / (self.factor*scaling));
        				var height = Math.ceil(parseInt(self.elements[i].sy) / (self.factor*scaling));
        				$("#page-" + page).append('<div id="measure-' + i + '" class="measure" style="left: ' + x + 'px; top: ' + y + 'px; width: ' + width + 'px; height: ' + height + 'px;" />');
        				if(i == self.cMeasure) {
        					$('#measure-' + i).addClass("measure-visible");
        					self.cPage = parseInt(page);
        					}
        				$('#measure-' + i).bind('click', {
        					id : i
        				  }, function(event) {
        					   if(self.measureClickCallback)
        						    self.measureClickCallback($(this), event.data.id);
        					   return false;
        				  });
        			}
        		});
        },
        
        refreshPages: function() {
        	this.maxPageWidth = this.e.width();
        	var scaling = this.pageWidth / this.maxPageWidth;
        	$(".pageimg").width(this.maxPageWidth);
        	for ( var i = 0; i < this.measureCount; i++) {
        		var x = Math.floor(parseInt(this.elements[i].x) / (this.factor*scaling));
        		var y = Math.floor(parseInt(this.elements[i].y) / (this.factor*scaling));
        		var width = Math.round(parseInt(this.elements[i].sx) / (this.factor*scaling));
        		var height = Math.ceil(parseInt(this.elements[i].sy) / (this.factor*scaling));
        		$('#measure-'+i).css({'left' : x, 'top' : y, 'width' : width, 'height' : height});
        	}
        },

        goTo: function(measureId) {
        	if (measureId >= 0 && this.elements && measureId < this.elements.length) {
        		return this.highlightMeasure($('#measure-' + measureId), measureId);
        	}
        	return false;
        },

        goToPage: function(pageNumber, highlightMeasure) {
        	if (pageNumber >= 0 && pageNumber < this.pages) {
        		if(pageNumber != this.cPage) {
			        if (highlightMeasure) {
			        	if(this.pageArray[pageNumber].length > 0) {
			        		var m = this.pageArray[pageNumber][0];
			        		if(m) {
			        			var measureId = m.id;
			        			var result = this.highlightMeasure($('#measure-' + measureId), measureId);
			        			if(result && this.pageChangeCallback)
			            			this.pageChangeCallback(pageNumber);
			        			return result;
			        		}
			        	}
			        }
			        
			        $('#page-'+this.cPage).hide();
				    $('#page-'+pageNumber).show();
				    this.cPage = pageNumber;
				    if(this.pageChangeCallback)
				    	this.pageChangeCallback(pageNumber);
			        return true;
        		}
        	}
        	return false;
        },
        
        nextPage: function(highlightMeasure) {
        	var nPage = this.cPage + 1;
        	return this.goToPage(nPage, highlightMeasure);
        },
        
        prevPage: function(highlightMeasure) {
        	var pPage = this.cPage - 1;
        	return this.goToPage(pPage, highlightMeasure);
        },
        
        nextMeasure: function(){
        	var m = this.cMeasure + 1; 
        	return this.goTo(m);
        },

        highlightMeasure: function(element, id) {
        	if (this.cMeasure != id) {
        		this.processHighlightMeasure(element, id);
        		if (this.measureChangeCallback)
        			this.measureChangeCallback(element, id);
        		return true;
        	}
        	return false;
        },
        processHighlightMeasure: function(element, id){
            $('.measure').removeClass("measure-visible");
          	element.addClass("measure-visible");
          	var pageBefore = this.currentPage();
            this.cMeasure = id;
            if(this.cMode == this.SLIDESHOW_VIEW) {
            	var currentPage = parseInt(this.elements[this.cMeasure].page);
            	if(pageBefore != currentPage) {
			        $('#page-'+pageBefore).hide();
			        $('#page-'+currentPage).show();
			        this.cPage = currentPage;
			        if(this.pageChangeCallback)
			        	this.pageChangeCallback(this.cPage);
            	}
            }
			if(this.scrollToMeasure) {
	            // Scroll to view the measure // do both in one
				var scrollTop = 0;
				var scrollLeft = 0;
				if (!this._isScrolledIntoViewV(".measure-visible")) {
					scrollTop = $(".measure-visible").offset().top - this.scrollTopMargin;
				}
				if (!this._isScrolledIntoViewH(".measure-visible")) {
					scrollLeft = $(".measure-visible").offset().left - this.scrollTopMargin;
				}
				if(scrollTop != 0 && scrollLeft != 0) {
					$('html, body').animate( {
							scrollTop : scrollTop,
							scrollLeft : scrollLeft
						}, 0);
				} else if (scrollTop != 0) {
					$('html, body').animate( {scrollTop : scrollTop}, 0);
	            } else if (scrollLeft != 0) {
	            	$('html, body').animate( {scrollLeft : scrollLeft}, 0);
	            }
			}
        },
        currentPage:function(){
        	return this.cPage;
        },
        switchToView:function(mode){
            if(mode == this.cMode)
                  return;
            this.processSwitchToView(mode);
        },
        processSwitchToView:function(mode) {
            var currentPage = this.currentPage();
            this.cMode = mode;
            if(mode == this.SLIDESHOW_VIEW) {
                  $('.mpager-page').not('#page-'+currentPage).hide();
            } else if (mode == this.NORMAL_VIEW) {
                  $('.mpager-page').show();
                  this.processHighlightMeasure($('#measure-' + this.cMeasure), this.cMeasure);
            }
        },
        _isScrolledIntoViewV:function(elem){
        	var docViewTop = $(window).scrollTop();
        	var docViewBottom = docViewTop + $(window).height() - this.bottomPadding;

        	var elemTop = $(elem).offset().top;
        	var elemBottom = elemTop + $(elem).height();

        	return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
        },
        _isScrolledIntoViewH:function(elem){
        	var docViewLeft = $(window).scrollLeft();
        	var docViewRight = docViewLeft + $(window).width() - this.bottomPadding;

        	var elemLeft = $(elem).offset().left;
        	var elemRight = elemLeft + $(elem).width();

        	return ((elemRight >= docViewLeft) && (elemLeft <= docViewRight) && (elemRight <= docViewRight) && (elemLeft >= docViewLeft));
        }
    });
}(jQuery));
