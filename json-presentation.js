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
   * @type {Object}
   */
  var layout = {
    init: function init() {
      this.container = $('#slide-container');
      this.controlsArea = $('#controls');
      this.controlButtons = {
        prev: $('#controls-prev'),
        next: $('#controls-next')
      };
      this.slideCount = $('#slide-count');
      this.progressBar = $('#progress-bar');
      this.listButton = $('#list');
      this.presentationsList = $('#presentations-list');
      this.blackLayer = $('#black-layer');
      this.listBackward = $('#list-backward-button');
    },
    /**
     * Отрисовывает рабочую область презентации - задает высоту элементов
     */
    load: function build() {
      this.init();
      this.container.css({'height':$(window).height()-this.controlsArea.height()});
      this.presentationsList.css({'height':$(window).height()});
      this.listButton.on('click',(function(){
        this.presentationsList.animate({'left':'0'},200);
        this.controlsArea.animate({'left':this.presentationsList.width()},200);
        this.container.animate({'left':this.presentationsList.width()},200);
        this.blackLayer.fadeTo(200,0.7);
      }).bind(this));
      this.listBackward.on('click',(function(){
        this.blackLayer.animate({'left':0},200);
        this.blackLayer.fadeOut(200);
        this.presentationsList.animate({'left':-this.presentationsList.width()},200);
        this.controlsArea.animate({'left':0},200);
        this.container.animate({'left':0},200);
      }).bind(this));
    },
    /**
     * Отрисовать рабочую область заново
     */
    reload: function reload() {
      this.listBackward.off('click');
      this.listButton.off('click');
      this.load();
    }
  };

  var Slide = function Slide(slideData) {
    this.caption = slideData.caption || '(Нет заголовка)';
    this.body = slideData.text || '(Пусто)';
    this.DOM = $(
      '<div class="slide-container">' +
      '<div class="slide">' +
      '<h1>'+this.caption+'</h1>' +
      '<div class="slide-body">'+this.body+'</div>' +
      '</div>' +
      '</div>');
    this.DOM.css({
      'width':layout.container.width(),
      'height':layout.container.height(),
      'display':'inline-block',
      'overflow':'hidden'
    });
  };

  var Presentation = function Presentation(data,presentationId){
    //Производим проверку данных
    try {
      this.name = data.name || 'Без имени';
      assert(typeof presentationId === 'number','Не передан ид презентации');
      assert(Array.isArray(data.slides), 'В презентации отсутствуют слайды');
      assert(data.slides.length>0,'В презентации нет ни одного слайда');
      assert(typeof presentationId==='number','В констурктор презентации не передан id презентации');
    } catch (e) {
      return alert('При обработке данных презентации "'+this.name+'" возникли ошибки. '+e);
    }
    this.id = presentationId;
    this.slides = [];
    //Устанавливаем текущий слайд в позицию 0
    this.currentSlide = 0;
    //Создаем контейнер для слайдов
    this.body = $('<div class="presentation-body" id="presentation-'+this.id+'">');
    //Не отображаем презентацию, пока она не выбрана
    this.body.css({'display':'none'});
    /**
     * Создает DOM презентации и присоеденяет его к DOMу основного документа
     */
    this.load = function load() {
      //Задаем контейнеру ширину и делаем презентацию видимой
      this.body.css({'width':layout.container.width()*data.slides.length,'display':'block'});
      //Присоединяем контейнер для слайдов к рабочей области презентации
      layout.container.append(this.body);
      //Показывем надпись "Слайды: 10/10"
      layout.slideCount.text('Слайд: '+(this.currentSlide+1)+'/'+this.slides.length);
      //Устанавливаем позицию прогрессбара
      layout.progressBar.css({'width':((this.currentSlide+1)/this.slides.length*100)+'%'});
      //Задаем размеры контейнеру со слайдами
      $('.slide-container').css({
          'width':layout.container.width(),
          'height':layout.container.height()
        });
      //Выставляем высоту слайдам
      $('.slide').css({'height':layout.container.height()});
      //Переключаем к позиции текущего слайда
      this.showSlide(this.currentSlide);
      //Прикрепляем функции показа слайдов на нажатия кнопок
      layout.controlButtons.prev.on('click',(function(){
        this.showPrevSlide();
      }).bind(this));
      layout.controlButtons.next.on('click',(function(){
        this.showNextSlide();
      }).bind(this));
    };
    /**
     * Показать следующий слайд
     */
    this.showNextSlide = function showNextSlide() {
      if (this.currentSlide < this.slides.length-1) {
        this.currentSlide++;
        this.showSlide(this.currentSlide);
      }
    };
    /**
     * Показать предыдущий слайд
     */
    this.showPrevSlide = function showPrevSlide() {
      if (this.currentSlide>0) {
        this.currentSlide--;
        this.showSlide(this.currentSlide);
      }
    };
    /**
     * Показать слайд с номером slideNumber
     * @param slideNumber
     */
    this.showSlide = function showSlide(slideNumber) {
      this.currentSlide = slideNumber;
      this.body.animate({'margin-left':-layout.container.width()*slideNumber});
      layout.slideCount.text('Слайд: '+(this.currentSlide+1)+'/'+this.slides.length);
      layout.progressBar.animate({'width':((this.currentSlide+1)/this.slides.length*100)+'%'});
    };
    /**
     * Выгружает презентацию из рабочей области
     * @param positionReset {Boolean} сбрасывать ли позицию слайда
     */
    this.unload = function unload(positionReset) {
      //Скрываем тело презентации
      this.body.css({'display':'none'});
      //Убираем обработчики событий с кнопок
      layout.controlButtons.prev.off('click');
      layout.controlButtons.next.off('click');
      //Сбрасываем позицию слайда в изначальное положение
      if (positionReset) {
        this.currentSlide = 0;
      }
    };
    /**
     * Перезагрузить визуальное отображение презентации
     * @param positionReset {Boolean} сбрасывать ли позицию слайда
     */
    this.reload = function reload(positionReset) {
      this.unload(positionReset);
      this.load();
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
   * @param condition {Boolean} условие
   * @param message {String} Сообщение об ошибке, если условие не выполняется
   */
  var assert = function assert (condition,message) {
    if (!condition) {
      message = message || "Assert failed";
      throw new Error(message);
    }
  };

  //Задаем текущую презентацию
  var currentPresentation = 0;

  //Отрисовываем область
  layout.load();
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
      //Создаем презентации
      presentations.push(new Presentation(data[i],i));
      layout.presentationsList.append('<li>'+presentations[i].name+'</div>');
    }
    //Загружаем первую презентацию, что бы фон превью в меню выбор презентации не пустовал
    presentations[currentPresentation].load();

  }).error(function(){
    alert('Не удалось загрузить файл с презентациями!');
  });

  //Перерисовываем рабочую область и презентацию при изменении размеров окна
  $(window).resize(function(){
    layout.reload();
    presentations[currentPresentation].reload();
  });
});
