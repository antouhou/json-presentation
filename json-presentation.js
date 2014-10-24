//todo: сделать возможность быстрого перепрыгывания между слайдами
//todo: делать кнопки неактивными, если показ предыдущего/следующего слайда недоступен

$(function () {

  "use strict";

  //Массив, в котором будут лежать все презентации
  var presentations = [];
  //Массив, в котром будут лежать пункты списка презентаций
  var presentationsList = [];
  //Задаем текущую презентацию
  var currentPresentation = 0;

  /**
   * Настройки
   */
  var options = {
    //Путь к json-файлу с презентациями
    pathToPresentations: '../presentations.json'
  };

  /**
   * Функция для проверки условий
   * @param condition {Boolean} условие
   * @param message {String} Сообщение об ошибке, если условие не выполняется
   */
  var assert = function assert(condition, message) {
    if (!condition) {
      message = message || "Assert failed";
      throw new Error(message);
    }
  };

  /**
   * Рабочая облась презентации
   */
  var layout = {
    /**
     * Создает разметку
     */
    init: function init() {
      //Создаем элементы
      this.container = $('<div class="presentation-container"></div>');
      this.controlsArea = $('<div class="controls"></div>');
      this.progressBar = $('<div class="progress-bar"></div>');
      this.listButton = $('<div class="list-button">К списку презентаций</div>');
      this.controlButtons = {
        prev: $('<div class="controls-button controls-prev"><</div>'),
        next: $('<div class="controls-button controls-next">></div>')
      };
      this.slideCount = $('<div class="slide-count"></div>');
      this.blackLayer = $('<div class="black-layer"></div>');
      this.presentationsList = $('<div class="presentations-list"></div>');
      this.presentationsListHeading = $('<h3>Список презентаций</h3>');
      this.presentationsListContainer = $('<div class="presentations-list-container"></div>');
      this.listBackward = $('<div class="list-backward-button controls-button">Отмена</div>');
      //Присоединяем все элементы в нужном порядке
      this.presentationsList.append(
        this.presentationsListHeading,
        this.presentationsListContainer,
        this.listBackward);
      this.container.append(
        this.controlsArea,
        this.blackLayer,
        this.presentationsList
      );
      this.controlsArea.append(
        this.progressBar,
        this.listButton,
        this.controlButtons.prev,
        this.controlButtons.next,
        this.slideCount
      );
      $('body').append(this.container);
    },

    /**
     * Отрисовывает рабочую область презентации - задает высоту элементов
     */
    load: function load() {
      this.container.css({'height': $(window).height() - this.controlsArea.height()});
      this.presentationsList.css({'height': $(window).height()});
      this.presentationsListContainer.css({
        'height': this.presentationsList.height() - this.listBackward.outerHeight(true) - this.presentationsListHeading.outerHeight(true)
      });
      this.listButton.on('click', list.show);
      this.listBackward.on('click', list.hide);
      this.blackLayer.css({
        'height': $(window).height(),
        'width': $(window).width()
      });
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

  /**
   * Список всех презентаций
   */
  var list = {
    show: function show() {
      layout.presentationsList.animate({'left': '0'}, 200);
      layout.controlsArea.animate({'left': layout.presentationsList.width()}, 200);
      layout.container.animate({'left': layout.presentationsList.width()}, 200);
      layout.blackLayer.fadeTo(200, 0.7);
    },
    hide: function hide() {
      layout.blackLayer.animate({'left': 0}, 200);
      layout.blackLayer.fadeOut(200);
      layout.presentationsList.animate({'left': -layout.presentationsList.width()}, 200);
      layout.controlsArea.animate({'left': 0}, 200);
      layout.container.animate({'left': 0}, 200);
    }
  };

  /**
   * Конструктор слайда
   * @param slideData
   * @constructor
   */
  var Slide = function Slide(slideData) {
    this.caption = slideData.caption || '(Нет заголовка)';
    this.text = slideData.text || '(Пусто)';
    //Контент отеделен от body, потому что он так же будет использоваться для рендера превью презентации
    this.content = '<div class="slide">' +
                     '<h1>' + this.caption + '</h1>' +
                     '<div class="slide-body">' + this.text + '</div>' +
                   '</div>';
    this.body = $('<div class="slide-container">' + this.content + '</div>');
  };

  /**
   * Конструктор презентации
   * @param data
   * @param presentationId
   * @constructor
   */
  var Presentation = function Presentation(data, presentationId) {
    //Производим проверку данных
    try {
      this.name = data.name || 'Без имени';
      assert(typeof presentationId === 'number', 'Не передан ид презентации');
      assert(Array.isArray(data.slides), 'В презентации отсутствуют слайды');
      assert(data.slides.length > 0, 'В презентации нет ни одного слайда');
      assert(typeof presentationId === 'number', 'В констурктор презентации не передан id презентации');
    } catch (e) {
      return alert('При обработке данных презентации "' + this.name + '" возникли ошибки. ' + e);
    }
    this.id = presentationId;
    this.slides = [];
    //Устанавливаем текущий слайд в позицию 0
    this.currentSlide = 0;
    //Создаем контейнер для слайдов
    this.body = $('<div class="presentation-body" id="presentation-' + this.id + '">');
    //Не отображаем презентацию, пока она не выбрана
    this.body.css({'display': 'none'});

    /**
     * Создает разметку презентации и присоеденяет её к размтеке контейнера;
     * Устанваливает обработчики на кнопки;
     * Задает размер слайдов;
     */
    this.load = function load() {
      //Устанавливаем текущую перезентацию
      currentPresentation = this.id;
      //Задаем контейнеру ширину и делаем презентацию видимой
      this.body.css({'width': layout.container.width() * data.slides.length, 'display': 'block'});
      //Присоединяем контейнер для слайдов к рабочей области презентации
      layout.container.append(this.body);
      //Показывем надпись "Слайды: 10/10"
      layout.slideCount.text('Слайд: ' + (this.currentSlide + 1) + '/' + this.slides.length);
      //Устанавливаем позицию прогрессбара
      layout.progressBar.css({'width': ((this.currentSlide + 1) / this.slides.length * 100) + '%'});
      //Задаем размеры контейнеру со слайдами
      $('.slide-container').css({
        'width': layout.container.width()
      });
      //Выставляем высоту слайдам
      $('.slide').css({'height': layout.container.height()});
      //Переключаем к позиции текущего слайда
      this.showSlide(this.currentSlide);
      //Прикрепляем функции показа слайдов на нажатия кнопок
      layout.controlButtons.prev.on('click', (function () {
        this.showPrevSlide();
      }).bind(this));
      layout.controlButtons.next.on('click', (function () {
        this.showNextSlide();
      }).bind(this));
    };

    /**
     * Показать следующий слайд
     */
    this.showNextSlide = function showNextSlide() {
      if (this.currentSlide < this.slides.length - 1) {
        this.currentSlide++;
        this.showSlide(this.currentSlide);
      }
    };

    /**
     * Показать предыдущий слайд
     */
    this.showPrevSlide = function showPrevSlide() {
      if (this.currentSlide > 0) {
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
      this.body.animate({'margin-left': -layout.container.width() * slideNumber});
      layout.slideCount.text('Слайд: ' + (this.currentSlide + 1) + '/' + this.slides.length);
      layout.progressBar.animate({'width': ((this.currentSlide + 1) / this.slides.length * 100) + '%'});
    };

    /**
     * Убирает обработчики событий с кнопок, опционально сбрасывает положение презентации к началу
     * @param positionReset {Boolean} сбрасывать ли позицию слайда
     */
    this.unload = function unload(positionReset) {
      //Скрываем тело презентации
      this.body.css({'display': 'none'});
      //Убираем обработчики событий с кнопок
      layout.controlButtons.prev.off('click');
      layout.controlButtons.next.off('click');
      //Сбрасываем позицию слайда в изначальное положение
      if (positionReset) {
        this.body.css({'margin-left': '0'});
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
    for (var i = 0; i < data.slides.length; i++) {
      //Создаем новый объект слайда
      this.slides[i] = new Slide(data.slides[i]);
      //Присоединяем тело слайда к телу презентации
      this.body.append(this.slides[i].body);
    }
  };

  /**
   * Конструктор пункта списка презентации и превью
   * @param presentationName
   * @param presentationId
   * @constructor
   */
  var ListItem = function ListItem(presentationName, presentationId) {
    this.body = $('<li>' + presentationName + '</li>');
    //Генерируем тело превью
    this.preview = $('<div class="presentation-preview">' + presentations[presentationId].slides[0].content + '</div>');
    //Добавляем превью в основной контейнер
    layout.container.append(this.preview);
    //Функция, устанавливающая позицию превью; Выделено в отдельную функцию, т.к понадобиться при измнении размеров окна
    this.setPreview = function setPreview() {
      this.preview.css({
        'height': layout.container.height(),
        'top': ($(window).height() - layout.container.height()) / 2,
        'left': layout.presentationsList.width() + ($(window).width() - this.preview.width())
      });
    };
    this.setPreview();
    this.showPreview = function showPreview() {
      this.preview.css({'display': 'block'}).animate({
        left: ((layout.container.width() + 200 - this.preview.width()) / 2),
        opacity: 1
      }, 400);
    };
    this.hidePreview = function hidePreview() {
      //Анимация затухания и смещения влево
      this.preview.animate({left: 0, opacity: 0}, 400, (function () {
        //После завершения анимации перемещаем превью в изначальное положение
        this.preview.css({
          'display': 'none',
          'left': layout.presentationsList.width() + ($(window).width() - this.preview.width())
        });
      }).bind(this));
    };
    this.action = function action() {
      //Убирем активный класс с предыдущего выбранного элемента
      presentationsList[currentPresentation].body.removeClass('active-class');
      //Выгружаем из рабочей области текущую презентацию
      presentations[currentPresentation].unload(true);
      //Заружаем выбранную презентацию
      presentations[presentationId].load();
      //Добавляем текущему элементу активный класс
      this.body.addClass('active-class');
      //Прячем список презентаций
      list.hide();
      this.hidePreview();
    };
    this.body.hover(this.showPreview.bind(this), this.hidePreview.bind(this));
    this.body.on('click', this.action.bind(this));
  };

  /**
   * Перерисовать все превью презентаций
   */
  var reloadAllPreviews = function reloadAllPreviews() {
    for (var i = 0; i < presentationsList.length; i++) {
      presentationsList[i].setPreview();
    }
  };

  //Создаем разметку
  layout.init();
  //Отрисовываем элементы
  layout.load();
  //Читаем JSON-файл с презентациями
  $.getJSON(options.pathToPresentations).done(function (data) {
    //Делаем проверку данных из файла
    try {
      assert(data != null, 'Файл пуст');
      assert(Array.isArray(data), 'Данные в файле не являются массивом');
      assert(data.length > 0, 'Массив презентаций пуст');
    } catch (e) {
      //Показываем сообщение об ошибке, если таковая имела место быть;
      return alert('При загрузке презентаций возникли ошибки! ' + e);
    }
    //Продолжаем выполнение, если ошибок не произошло
    for (var i = 0; i < data.length; i++) {
      //Создаем презентации
      presentations.push(new Presentation(data[i], i));
      presentationsList[i] = new ListItem(presentations[i].name, i);
      layout.presentationsListContainer.append(presentationsList[i].body);
    }
    //Отрисовываем первую презентацию
    presentations[currentPresentation].load();
  }).error(function () {
    alert('Не удалось загрузить файл с презентациями!');
  });

  //Перерисовываем рабочую область и презентацию при изменении размеров окна
  $(window).resize(function () {
    //Перерисовываем элементы
    layout.reload();
    //Перезагружаем презентацию
    presentations[currentPresentation].reload();
    //Перезагружаем превью презентаций
    reloadAllPreviews();
  });
});
