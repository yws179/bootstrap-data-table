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
        options = typeof option == 'object' && option
      
      if (!dataTable) {
        dataTable = new DataTable($this, options)
        $this.data('dataTable', dataTable)
      }
      
      if ('string' === typeof option) {}
    })
  }
  
  var DataTable = function ($table, options) {
  
    if (!$table.is('table')) {
      throw new Error('This is not <table> DOM')
    }
    
    this.$table = $table;
    
    this.$caption = this.$table.find('caption')
    
    this.$thead = this.$table.find('thead')
    
    this.$tbody = this.$table.find('tbody')
    
    this.options = options || {}
    
    this.data = this.options.data || []
    
    this.visibleData = this.data
  
    this.$btns = $([])
    
    this.filterable = this.options.filterable
    
    this.sortedField = undefined
  
    this._init()
    
  }
  
  DataTable.prototype = {
  
    constructor: DataTable,
    
    _init: function () {
      this.$table.addClass('table table-striped table-bordered table-hover')
        .css('table-layout', 'fixed')
  
      this.$tbody.css('cursor', 'pointer')
      
      if (this.$caption.length < 1) {
        this.$caption = $('<caption></caption>')
        this.$table.prepend(this.$caption)
      }
      
      if (this.$thead.length < 1) {
        this.$thead = $('<thead></thead>')
        this.$caption.after(this.$thead)
      }
  
      if (this.$tbody.length < 1) {
        this.$tbody = $('<tbody></tbody>')
        this.$thead.after(this.$tbody)
      }
      
      this.rendCaption()
      
      this.renderHead()
      
      this.renderData()
    },
    
    rendCaption: function () {
      var $btnGroup = $('<div class="btn-group pull-right"></div>')
      $btnGroup.append(`
            <button class="btn btn-default btn-create" type="button" title="新增">
                <span class="glyphicon glyphicon-plus"></span>
            </button>
            <button class="btn btn-default btn-refresh" type="button" title="刷新">
                <span class="glyphicon glyphicon-refresh"></span>
            </button>
        `);
      if (this.filterable) {
        $btnGroup.append(`
          <button class="btn btn-default btn-filter" type="button" title="过滤器">
                <span class="glyphicon glyphicon-filter"></span>
          </button>
        `)
      }
      this.$caption.append($btnGroup)
      if (this.options.title) {
        this.$caption.prepend('<span>' + this.options.title + '</span>')
      }
    },
    
    renderHead: function () {
      var $tr = $('<tr></tr>');
      for (var key in this.options.fields) {
        $tr.append('<th>' + this.options.fields[key] + '</th>')
      }
      this.$thead.append($tr)
      
      if (this.filterable) {
        var $filter = $('<tr class="data-table-filter" style="display: none;"></tr>')
        for (var key in this.options.fields) {
          $filter.append('<th><input class="form-control" name="#name"></th>'.replace('#name', key))
        }
        this.$thead.append($filter)
        this.$caption.find('.btn-filter').click(function () {
          $(this).toggleClass('active')
          $filter.toggle()
        })
        this.$table.on('change keyup paste', '.data-table-filter :input', function () {
          var filterConditions = {}
          this.$table.find('.data-table-filter :input').each(function() {
            var name = $(this).attr('name')
            var value = $(this).val()
            if (name == 'maxFileSize') {
              value *= 1024 * 1024
            }
            if ($(this).data('strict')) {
              fillValue(filterConditions, name + '-strict', true)
            }
            fillValue(filterConditions, name, value)
          })
          this.renderData(filtrate(this.data, filterConditions))
        }.bind(this))
      }
    },
    
    renderData: function (data) {
      this.visibleData = data || this.visibleData
      this.$tbody.html('')
      for (var i in this.visibleData) {
        var $tr = $('<tr></tr>')
        for (var key in this.options.fields) {
          $tr.append('<td>' + this.visibleData[i][key] + '</td>')
        }
        this.$tbody.append($tr)
      }
    }
  }
  
  var compare = function (v1, v2, field) {
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
  }
  
  var filtrate = function (array, conditions) {
    var newArray = []
    array.forEach(function (val) {
      if (!isFiltrate(val, conditions)) {
        newArray.push(val)
      }
    })
    return newArray
  }
  
  var isFiltrate = function (obj, conditions) {
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
  
  var isEmpty = function (o) {
    return o == undefined || o == ''
  }
  
  /**
   * 給對象賦值 當name爲a.b則代表對targetObj.a.b賦值
   * @param targetObj 目標對象
   * @param name 下標，子對象屬性以‘parentObj.childObj.property’
   * @param value 值
   */
  var fillValue = function (targetObj, name, value, type) {
    if (!isEmpty(targetObj) && !isEmpty(name) && !isEmpty(value)) {
      recursionFill(targetObj, name, value, type)
    }
  }
  
  var recursionFill = function (ref, name, value, type) {
    var dotIdx = name.indexOf('.')
    if (dotIdx == -1) {
      if (type == 'list') {
        ref[name] = ref[name] ? ref[name] : []
        ref[name].push(value)
      } else {
        ref[name] = value
      }
      return
    }
    var tmpName = name.substr(0, dotIdx)
    if (isEmpty(ref[tmpName])) {
      ref[tmpName] = {}
    }
    recursionFill(ref[tmpName], name.substr(dotIdx + 1), value, type)
  }
  
})(jQuery)