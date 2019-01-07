/*
 * Plugin:  bootstrap-data-table
 * Author:  Weisen Yan (严伟森)
 * Github:  https://github.com/yws179/bootstrap-data-table
 * Version: 0.0.1
 * Licensed under the MIT license
 */

(function ($) {
  
  $.fn.dataTable = function (option) {
    return this.each(function () {
      var $this = $(this),
        dataTable = $this.data('dataTable'),
        options = typeof option == 'object' ? option : {}
      
      if (!dataTable) {
        dataTable = new DataTable($this, options)
        $this.data('dataTable', dataTable)
      }
      
      if ('string' === typeof option) {}
    })
  }
  
  var DataTable = function ($table, options) {
    
    this.$table = $table
    
    this.$thead = this.$table.find('thead')
    
    this.$tbody = this.$table.find('tbody')
    
    this.options = options
    
    this.sortedField = undefined
  
    this._init()
    
  }
  
  DataTable.prototype = {
  
    constructor: DataTable,
    
    _init: function () {
      this.$table.addClass('table table-striped table-bordered table-hover')
  
      this.$tbody.css('cursor', 'pointer')
      
      this.renderHead()
      
      this.renderData()
    },
    
    renderHead: function () {
      var $tr = $('<tr></tr>');
      for (var key in this.options['fields']) {
        $tr.append('<th>' + this.options['fields'][key] + '</th>')
      }
      this.$thead.append($tr)
    },
    
    renderData: function (data) {
      data = data || this.options['data']
      for (var i in data) {
        var $tr = $('<tr></tr>')
        for (var key in this.options['fields']) {
          $tr.append('<td>' + data[i][key] + '</td>')
        }
        this.$tbody.append($tr)
      }
    },
    
    compare: function (v1, v2, field) {
      if (field) {
        v1 = v1[field]
        v2 = v2[field]
      }
      if (/^\d+$/.test(v1) && /^\d+$/.test(v2)) {
        v1 = Number(v1)
        v2 = Number(v2)
      }
      if (v1 > v2 || v2 == undefined) {
        return 1
      } else if (v1 < v2 || v1 == undefined) {
        return -1
      }
      return v1.id > v2.id ? 1 : -1
    },
    
    filter: function (array, conditions) {
      var newArray = []
      array.forEach(function (val) {
        if (!this.isFilter(val, conditions)) {
          newArray.push(val)
        }
      })
      return newArray
    },
    
    isFilter: function (obj, conditions) {
      for (var key in conditions) {
        if (!conditions.hasOwnProperty(key) || key.endsWith('-strict')) {
          continue
        }
        if (conditions[key + '-strict'] && obj[key] != conditions[key]) {
          return true
        } else if ((obj[key] + '').indexOf(conditions[key]) == -1) {
          return true
        }
      }
      return false
    }
  }
  
})(jQuery)