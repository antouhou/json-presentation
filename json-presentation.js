"use strict";
//todo: сделать возможность быстрого перепрыгывания между слайдами

$(function(){
  var presentations = [];
  /**
   * Настройки
   */
  var options = {
    //Путь к папке с json-файлом с презентациями
    pathToPresentations: '../presentations.json'
  };
  /**
   * Рабочая облась презентации
   * @type {{create}}
   */
  var layout = {
    init: function init(next) {
      this.container = $('#slide-container');
      this.controlsArea = $('#controls');
      this.controlButtons = {
        prev: $('#controls-prev'),
        next: $('#controls-next')
      };
      next();
    },
    /**
     * Отрисовывает рабочую область презентации - задает фон, создает контролы и т.д.
     */
    build: function build() {
      this.init(function(){
        layout.container.css({'height':$(window).height()});
      });
    }
  };

  var Slide = function Slide(slideData) {
    //Производим проверку данных
    //Тут нет каких-то данных, которые требовали бы проверки
    try {
      //assert();
    } catch (e) {
      return alert(e);
    }
    this.caption = slideData.caption || '(Нет заголовка)';
    this.body = slideData.text || '(Пусто)';
    this.show = function show() {
      //Двигаем презентацию на нужную позицию
    };
    this.DOM = $(
      '<div id="p1s1" class="slide-container">' + //todo: сделать слайдам идентификаторы
      '<div class="slide">' +
      '<h1>'+this.caption+'</h1>' +
      '<div class="slide-body">'+this.body+'</div>' +
      '</div>' +
      '</div>');
    this.DOM.css({'width':layout.container.width(),'height':layout.container.height(),'display':'inline-block'});
  };

  var Presentation = function Presentation(data,presentationId){
    //Производим проверку данных
    try {
      this.name = data.name || 'Без имени';
      this.id = presentationId;
      assert(Array.isArray(data.slides), 'В презентации отсутствуют слайды');
      assert(data.slides.length>0,'В презентации нет ни одного слайда');
      assert(typeof presentationId==='number','В констурктор презентации не передан id презентации');
    } catch (e) {
      return alert('При обработке данных презентации "'+this.name+'" возникли ошибки. '+e);
    }
    this.slides = [];
    //Создаем контейнер для слайдов
    this.body = $('<div class="presentation-body" id="presentation-'+this.id+'">');
    /**
     * Создает DOM презентации и присоеденяет его к DOMу основного документа
     */
    this.load = function load() {
      //Задаем контейнеру ширину
      this.body.css({'width':layout.container.width()*data.slides.length});
      //Присоединяем контейнер для слайдов к рабочей области презентации
      layout.container.append(this.body);
      layout.controlButtons.prev.on('click',(function(){
        this.showSlide(0);
      }).bind(this));
      layout.controlButtons.next.on('click',(function(){
        this.showSlide(1);
      }).bind(this));
    };
    /**
     * Показать слайд с номером slideNumber
     * @param slideNumber
     */
    this.showSlide = function showSlide(slideNumber) {
      this.body.animate({'margin-left':-layout.container.width()*slideNumber});
    };

    //Добавляем в презентацию слайды
    for (var i=0; i<data.slides.length; i++) {
      //Создаем новый объект слайда
      this.slides[i] = new Slide(data.slides[i]);
      //Присоединяем тело слайда к телу презентации
      this.body.append(this.slides[i].DOM);
    }
  };

  /**
   * Функция для проверки условий
   * @param condition
   * @param message
   */
  var assert = function assert (condition,message) {
    if (!condition) {
      message = message || "Assert failed";
      throw new Error(message);
    }
  };

  //Отрисовываем область
  layout.build();
  //Читаем JSON-файл с презентациями
  $.getJSON(options.pathToPresentations).done(function(data){
    //Делаем проверку данных из файла
    try {
      assert(data != null,'Файл пуст');
      assert(Array.isArray(data),'Данные в файле не являются массивом');
      assert(data.length>0,'Массив презентаций пуст');
    } catch(e){
      //Показываем сообщение об ошибке, если таковая имела место быть;
      return alert('При загрузке презентаций возникли ошибки! '+e);
    }
    //Продолжаем выполнение, если ошибок не произошло
    for (var i=0; i<data.length; i++) {
      presentations.push(new Presentation(data[i],i));
      presentations[i].load();
    }

  }).error(function(){
    alert('Не удалось загрузить файл с презентациями!');
  });

  //Биндим действия на события
  $(window).resize(function(){
    //todo: сделать перезагрузку всей презентации при изменении размеров окна
    layout.build();
    console.log('layout was rebuild due to window size has changed');
  });
});
