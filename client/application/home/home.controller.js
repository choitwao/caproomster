(function(angular){

  'use strict';

  angular.module('caproomster').controller('caproomster.home.HomeController', HomeController);

  HomeController.$inject = [
    '$state',
    'moment',
    'calendarConfig',
    '$interval',
    'caproomster.api.ApiService',
    'caproomster.home.HomeService'];

  function HomeController($state, moment, calendarConfig, $interval, ApiService, HomeService) {

    var vm = this;
    var currentUser = null;
    vm.$onInit = init;

    // Init function

    function init() {
      vm.toggleMenu = toggleMenu;
      vm.changeRoom = changeRoom;
      vm.makeReservation = makeReservation;
      vm.resetCache = resetCache;
      vm.setCache = setCache;
      vm.dateToNumber = HomeService.dateToNumber;
      vm.calendarView = 'week';
      vm.viewDate = new Date();
      vm.toggleText = 'Show Room List';
      vm.message = 'Select a timeslot to start reservation';
      vm.roomList = [];
      vm.roomNumber = '';
      vm.cellIsOpen = true;
      vm.events = [];
      vm.myReservations = [];
      vm.myWaitingList = [];
      initData();
      $interval(getRoomInfo, 1500);
    }

    // check login and init all data for the view

    function initData() {
      vm.resetCache();
      ApiService.account('checkLogin').then(function(loggedInUser) {
        currentUser = loggedInUser.success.username;
        vm.authenticated = true;
        ApiService.booking('getRoomList').then(function(roomList) {
          vm.roomList = roomList.rooms;
          vm.roomNumber = vm.roomList[0];
          getRoomInfo();
          getMyInfo();
        });
      }, function() {
        $state.go('login');
      });
    }

    // get ROOM reservations and waitings

    function getRoomInfo() {
      var tempEvents = [];
      ApiService.booking('getAllReservation', {
        roomId: vm.roomNumber
      }).then(function(res){
        var reservations = res.reservations || [];
        var waitingList = res.waitingList || [];
        for (var i = 0; i < reservations.length; i++) {
          tempEvents.push(HomeService.createEvent(reservations[i], calendarConfig.colorTypes.info));
        }
        for (var j = 0; j < waitingList.length; j++) {
          tempEvents.push(HomeService.createEvent(reservations[i], calendarConfig.colorTypes.warning));
        }
        vm.events = tempEvents;
      });
    }

    // get USER reservations and waitings

    function getMyInfo() {
      ApiService.booking('getMyReservation', {
        userId: currentUser
      }).then(function(myReservations) {
        vm.myReservations = myReservations.reservations;
        vm.myWaitingList = myReservations.waitings;
      });
    }

    // Make one reservation

    function makeReservation() {
      var payload = {
        roomId: vm.roomNumber,
        username: currentUser,
        timeslot: {
          startTime: vm.cache.start,
          endTime: parseInt(vm.cache.start) + parseInt(vm.cache.length),
          date: vm.cache.date
        },
        equipment: vm.cache.equipment,
        description: currentUser + '\'s Reservation'
      };
      ApiService.booking('reserve', payload).then(function() {
        showMessage('Successfully reserved.');
        vm.resetCache();
        getRoomInfo();
        getMyInfo();
      }, function() {
        vm.resetCache();
        showMessage('Fail to reserve, please try again.');
      });
    }

    /*
    Helper Functions
    */

    // show message

    function showMessage(msg) {
      vm.message = msg;
      setTimeout(function(){
        vm.message = 'Select a timeslot to start reservation!';
      }, 600);
    }

    // reset cache

    function resetCache() {
      vm.cache = {
        equipment: {
          laptop: 0,
          projector: 0,
          board: 0
        },
        length: 1,
        start: null,
        date: null,
        inAction: null,
        reservationId: null
      };
    }

    // set cache

    function setCache(res, action) {
      console.log(res);
      vm.cache = {
        equipment: {
          laptop: res.equipment.laptops,
          projector: res.equipment.projectors,
          board: res.equipment.whiteboards
        },
        length: parseInt(res.timeslot.endTime) - parseInt(res.timeslot.startTime),
        start: parseInt(res.timeslot.startTime),
        date: res.timeslot.date,
        inAction: action,
        reservationId: res.reservationId
      };
    }

    // change room and fetch room data

    function changeRoom(room) {
      vm.roomNumber = room;
      getRoomInfo();
    }

    // Toggle Menu

    function toggleMenu() {
      if (!vm.isToggled) {
        vm.isToggled = true;
        vm.toggleText = 'Hide Room List';
      } else {
        vm.isToggled = false;
        vm.toggleText = 'Show Room List';
      }
    }

  }

})(angular);
