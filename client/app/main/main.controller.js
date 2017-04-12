angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window, $animate) {

    // Interval Check
    $window.setInterval(function () {
        let dateTime = moment();
        $scope.time = dateTime.format('h:mm A');
        $scope.date = dateTime.format('MMMM DD YYYY');
        $scope.medicationCheck(dateTime)
        $scope.$apply();
    }, 1000);

    // initializing start date
    $scope.selectedDate = new Date();
    // Watching for date changes
    $scope.$watch('selectedDate', (day) => {
        let start = moment(day).format('MM/DD/YYYY');
        let end = moment(day).add(1, 'day').format('MM/DD/YYYY');
        $http.get(`/api/medications?start=${start}&end=${end}`).then(function (meds) {
            $scope.meds = meds.data;
        });
    })

    // When complete button is clicked
    $scope.complete = function(m){
        let currentTime = moment();
        $http.put(`/api/medications/${m._id}`, { completed:true, d: { f: currentTime} } ).then(function (res) {
          let med = res.data;
          m.completed = med.completed;
          m.d.f = med.d.f;
        });
    }

    // Medication interval check
    $scope.medicationCheck = function(currentTime){
        currentTime = currentTime.startOf('minute');
        for(i=0; i < $scope.meds.length; i++){
            let m = $scope.meds[i];
            if(m.completed) continue;

            let medTime = moment(m.time).startOf('minute');

            // Right Time
            if(currentTime.isSame(medTime) && !m.alert){
                m.alert = 1;
                m.animation = "animated bounceIn";
                let ding = new Audio('assets/sounds/soft.wav')
                ding.play();
            }

            // Late Time
            if(currentTime.isSame(medTime.add(5,'minutes')) && (!m.alert || m.alert < 2)){
                m.alert = 2;
                let ring = new Audio('assets/sounds/loud.wav')
                ring.play();
            }

        }
    }

    /** 
     * Filters
     */
    $scope.dateCheck = function(m,offset){
        offset = offset || 0;
        return moment(m.time) <= moment().add(offset, 'minutes')
    }
    $scope.late = function(m){
        if($scope.dateCheck(m,5) && !m.completed ) return true;
        return false;
    }
    // Check if caregiver gave medication 5 minutes late even if she completed
    $scope.permaLate = function(m){
        return moment(m.time) <= moment(m.d.f).add(5, 'minutes');
    }
    $scope.completed = function(m){
        return m.completed;
    }

    // Get Icon for notifications
    $scope.getIcon = function(m){
        if(m.completed) return 'glyphicon-check';
        if($scope.late(m)) return 'glyphicon-exclamation-sign'
        return 'glyphicon-time';
    }
});
