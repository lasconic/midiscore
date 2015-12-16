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

      this.consumerKey = opts.consumerKey;

      this.factor = 12;

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

        var change = (!this.scoreChanged ? '' : '?no-cache='+this.scoreChanged );
        for (var i = 0; i < self.pages; i++) {
            this.e.append('<div id="page-' + i + '" class="mpager-page">'+
                '<img id="pageimg-' + i + '" class="pageimg" src="http://' + this.staticBucket + '/' + this.scoreId + '/' + this.scoreSecret + '/score_' + i + '.png'+change+'"/>' +
                '<canvas id="pagecanvas-' + i + '" class="pagecanvas"></canvas>' +
                '</div>');
        }

        $(".pagecanvas").click(function(evt) {
            var rect = this.getBoundingClientRect();
            var page = $(this).attr('id').split("-")[1];
            var x = evt.clientX - rect.left;
            var y = evt.clientY - rect.top;
            var boxes = self.pageArray[page];
            var measureId = -1
            var scaling = (self.pageWidth / self.e.width()) * 12;
            for (var i = 0; i < boxes.length; i++) {
                var e = boxes[i];
                var xb =  e.x / scaling
                var yb =  e.y / scaling
                var sxb =  e.sx / scaling
                var syb =  e.sy / scaling
                if (xb < x && x < xb + sxb && yb < y  && y < yb + sxb) {
                    measureId = e.id
                    break
                }
            }
            if (measureId != -1)
                alert( "Handler for .click() called. page " + page + "  -  " + x + "  -  " + y + " - " + measureId);
        });

            //var currentPage = this.currentPage();
            //$('.mpager-page').not('#page-'+currentPage).hide();

            $.getJSON(this.apiServer + "/services/rest/score/" + this.scoreId + "/space.jsonp?secret=" + this.scoreSecret + "&oauth_consumer_key="+ this.consumerKey +"&callback=?", function(data) {
             self.elements = data;
             self.measureCount = data.length;
             self.pageArray = new Array();
             for (var i = 0; i < self.measureCount; i++) {
                var page = data[i].page;
                if(!self.pageArray[page])
                    self.pageArray[page] = new Array();
                self.pageArray[page].push(data[i]);
            }
        });
        },

        goTo: function(measureId, percent) {
            percent = typeof percent !== 'undefined' ? percent : -1;
            if (measureId >= 0 && this.elements && measureId < this.elements.length) {
              return this.highlightMeasure(measureId, percent);
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
                      var result = this.highlightMeasure(measureId);
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
processHighlightMeasure: function(id, percent) {
    percent = typeof percent !== 'undefined' ? percent : 0;
    this.cMeasure = id;
    var e = this.elements[this.cMeasure];
    var currentPage = parseInt(e.page);
    var canvas = $("#pagecanvas-" + currentPage)

    var c = canvas[0]
    var ctx = c.getContext("2d");
            //console.log("wd " + $("#pageimg-" + currentPage).width())
            //console.log("hg" + $("#pageimg-" + currentPage).height())


            ctx.canvas.width = $("#pageimg-" + currentPage).width()
            ctx.canvas.height = $("#pageimg-" + currentPage).height()
            ctx.clearRect(0, 0, c.width, c.height);

            if (false) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
                ctx.fillRect(0,0,c.width,c.height);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(c.width, c.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, c.height);
                ctx.lineTo(c.width, 0);
                ctx.stroke();
            }

            var scaling = (this.pageWidth / this.e.width()) * 12;
            //console.log(this.pageWidth)
            //console.log(this.e.width())
            //console.log(scaling)
            var x =  e.x / scaling
            var y =  e.y / scaling
            var sx =  e.sx / scaling
            var sy =  e.sy / scaling
            console.log(percent + " - " + x + " - " + y  + " - " + sx + " - " + sy + " - " + c.height + " - " + c.width)

            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 5 / scaling;
            ctx.beginPath();
            var rect = {"x" : x + sx * percent, "y" : y - 20 / scaling, "width": ctx.lineWidth, "height" : sy + 2 * 20 / scaling}
            ctx.moveTo(rect.x, y - 20 / scaling);
            ctx.lineTo(rect.x, y + sy + 20 / scaling);
            ctx.stroke();
            console.log(currentPage)
            console.log("rect.y " + rect.y)

            rect.y = rect.y + currentPage * ctx.canvas.height;
            console.log("rect.y " + rect.y)

            if(this.scrollToMeasure) {
                // Scroll to view the measure // do both in one
                var scrollTop = 0;
                var scrollLeft = 0;
                if (!this._isScrolledIntoViewV(rect)) {
                    scrollTop = rect.y - this.scrollTopMargin;
                }
                if (!this._isScrolledIntoViewH(rect)) {
                    scrollLeft = rect.x - this.scrollTopMargin;
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
        highlightMeasure: function(id, percent) {
            percent = typeof percent !== 'undefined' ? percent : 0;
            this.processHighlightMeasure(id, percent);
            if (this.cMeasure != id) {
              if (this.measureChangeCallback)
                 this.measureChangeCallback(id);
             return true;
         }
         return false;
     },
     currentPage:function(){
       return this.cPage;
   },
   _isScrolledIntoViewV:function(rect){
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height() - this.bottomPadding;

    var elemTop = rect.x;
    var elemBottom = elemTop + rect.height;

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
},
_isScrolledIntoViewH:function(rect){
    var docViewLeft = $(window).scrollLeft();
    var docViewRight = docViewLeft + $(window).width() - this.bottomPadding;

    var elemLeft = rect.y;
    var elemRight = elemLeft + rect.width;

    return ((elemRight >= docViewLeft) && (elemLeft <= docViewRight) && (elemRight <= docViewRight) && (elemLeft >= docViewLeft));
}
});
}(jQuery));
