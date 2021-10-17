'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const formUpdate = document.querySelector('.form--update');
const inputDistanceUpdate = document.querySelector('.form--update .form__input--distance');
const inputDurationUpdate = document.querySelector('.form--update .form__input--duration');
const inputCadenceUpdate = document.querySelector('.form--update .form__input--cadence');
const inputElevationUpdate = document.querySelector('.form--update .form__input--elevation');
const inputTypeUpdate = document.querySelector('.form--update .form__input--type');

const containerWorkouts = document.querySelector('.workouts');

const inputType = document.querySelector('.form--create .form__input--type');
const inputDistance = document.querySelector('.form--create .form__input--distance');
const inputDuration = document.querySelector('.form--create .form__input--duration');
const inputCadence = document.querySelector('.form--create .form__input--cadence');
const inputElevation = document.querySelector('.form--create .form__input--elevation');

const btnDelete = document.querySelector('.btn__deleteAll');
const btnSort = document.querySelector('.btn__sort');
const inputCriterion = document.querySelector('.sort__criterion');
const inputSortType = document.querySelector('.sort__type');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  _createDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calPace();
    this._createDescription();
  }
  calPace() {
    //min/km
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calSpeed();
    this._createDescription();
  }
  calSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
  }
}
const run1 = new Running(100, 100, [50, 50], 12);
class App {
  #mapEvent;
  #map;
  #workouts = [];
  #updateWorkout;
  constructor() {
    // get data from the local storage
    this._getLocalStorage();
    //get the users position
    this._getPosition();
    
    //Event Listener
    form.addEventListener('submit', this._newWorkouts.bind(this));
    inputType.addEventListener('change', this._toggleElementField);
    inputTypeUpdate.addEventListener('change', this._toggleElementUpdateField);
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
    document.addEventListener('click',this._editWorkout.bind(this));
    document.addEventListener('click',this._deleteWorkout.bind(this));
    formUpdate.addEventListener('submit',this._updateWorkout.bind(this));
    btnDelete.addEventListener('click',this._deleteAllWorkouts.bind(this));
    btnSort.addEventListener('click',this._sortWorkouts.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coord = [latitude, longitude];
    this.#map = L.map('map').setView(coord, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    //Load the workout in the local storage
    this.#workouts.forEach(this._implementWorkout.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElementField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _toggleElementUpdateField() {
    inputCadenceUpdate.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevationUpdate.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkouts(e) {
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    let workout;

    //Check valid data
    //small helper function to check
    const validNumber = inputs => inputs.every(inp => Number.isFinite(inp));
    const validPositive = inputs => inputs.every(inp => inp > 0);

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validNumber([distance, duration, cadence]) ||
        !validPositive([distance, duration, cadence])
      )
        alert('Invalid input value ( some input must be positive numbers!)');
      else {
        //Creating running object
        workout = new Running(distance, duration, coords, cadence);
      }
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validNumber([distance, duration, elevation]) ||
        !validPositive([distance, duration])
      )
        return alert(
          'Invalid input value ( some input must be positive numbers!)'
        );
      else {
        //Creating cyling object
        workout = new Cycling(distance, duration, coords, elevation);
      }
    }
    if (workout) {
      //Add object to the array workout
      this.#workouts.push(workout);
      this._implementWorkout(workout);
      //Set local storage for the workout
      this._setLocalStorage();
    }
  }
  _implementWorkout(workout) {
    {
      
      //Rendering the marker and popup
      L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
          L.popup({
            maxwidth: 250,
            minwidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
          })
        )
        .setPopupContent(workout.description)
        .openPopup();
      //Rendering the list
      this._renderingTheList(workout);
      //Clear input field and hide form + hide form
      this._hideForm(form);
      this._hideForm(formUpdate)
    }
  }
  _renderingTheList(workout) {
    let html = `
<li class="workout workout--${workout.type}" data-id="${workout.id}">
  <div class="workout__btn">
    <div class="btn__items workout__edit"><i class="fas fa-edit"></i></div>
    <div class="btn__items workout__delete"><i class="fas fa-trash-alt"></i></div>
  </div>
  <h2 class="workout__title">${workout.description}</h2>
  <div class="workout__details">
    <span class="workout__icon">${
      workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    }</span>
    <span class="workout__value">${workout.distance}</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⏱</span>
    <span class="workout__value">${workout.duration}</span>
    <span class="workout__unit">min</span>
  </div>
          `;
    if (workout.type === 'running')
      html += `
  <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.pace.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  </div>
</li>`;
    else
      html += `
  <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
  </div>
</li>`;
    formUpdate.insertAdjacentHTML('afterend', html);
  }
  _hideForm(form) {
    //prettier-ignore
    inputDistance.value =inputDuration.value =inputCadence.value =inputElevation.value ='';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _moveToMarker(e) {
    const workOutEl = e.target.closest('.workout');
    if (!workOutEl) return;
    else {
      const workout = this.#workouts.find(
        work => work.id === workOutEl.dataset.id
      );
      this.#map.setView(workout.coords , 13, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); //is a big string
    if(!data) return;
    this.#workouts = data;   
  }
  reset(){
    localStorage.removeItem('workouts');
    location.reload();
  }

  //Promotion of the application
  _editWorkout(e){
    //Show form with the current value 
    const workoutEl = e.target.closest('.workout');
    if(!workoutEl || !e.target.closest('.workout__edit')) return;
    const workout = this.#workouts.find(workout => workout.id === workoutEl.dataset.id);
    formUpdate.classList.remove('hidden');
    inputDistanceUpdate.value = workout.distance;
    inputDurationUpdate.value = workout.duration;
    inputTypeUpdate.querySelector(`option[value = ${workout.type}]`).setAttribute('selected','selected');
    if(workout.type === 'running') {
      inputCadenceUpdate.value = workout.cadence;
    }
    else {
      this._toggleElementUpdateField();
      inputElevationUpdate.value = workout.elevationGain;
    }
    workoutEl.parentElement.removeChild(workoutEl);
    //updating after editted
    this.#updateWorkout = workout;
    
  }
  _updateWorkout(e){
    e.preventDefault();
    const type = inputTypeUpdate.value;
    const distance = +inputDistanceUpdate.value;
    const duration = +inputDurationUpdate.value;
    const coords = this.#updateWorkout.coords;
    let workout;

    //Check valid data
    //small helper function to check
    const validNumber = inputs => inputs.every(inp => Number.isFinite(inp));
    const validPositive = inputs => inputs.every(inp => inp > 0);

    if (type === 'running') {
      const cadence = +inputCadenceUpdate.value;

      if (
        !validNumber([distance, duration, cadence]) ||
        !validPositive([distance, duration, cadence])
      )
        {alert('Invalid input value (rr some input must be positive numbers!)');
      }
      else {
        //Creating running object
        workout = new Running(distance, duration, coords, cadence);
      }
    }
    if (type === 'cycling') {
      const elevation = +inputElevationUpdate.value;
      if (
        !validNumber([distance, duration, elevation]) ||
        !validPositive([distance, duration])
      )
        return alert(
          'Invalid input value (cc some input must be positive numbers!)'
        );
      else {
        //Creating cyling object
        workout = new Cycling(distance, duration, coords, elevation);
      }
    }



     //delete old workout
     this.#workouts.push(workout);
      this._implementWorkout(workout);
      this.#workouts.splice(+this.#workouts.findIndex(workout => workout.id === this.#updateWorkout.id),1);
      //Set local storage for the workout
      this._setLocalStorage();
      location.reload();
    
  }
  _deleteWorkout(e){
    const workoutEl = e.target.closest('.workout');
    if(!workoutEl || !e.target.closest('.workout__delete')) return;
    this.#workouts.splice(+this.#workouts.findIndex(workout => workout.id === workoutEl.dataset.id),1);
    workoutEl.parentElement.removeChild(workoutEl)
    this._setLocalStorage();
    location.reload();
    
  }
  _deleteAllWorkouts(){
    document.querySelectorAll('.workout').forEach(work => {
      work.parentElement.removeChild(work);
    })
    this.#workouts = [];
    localStorage.removeItem('workouts');
    location.reload();
  }
  _sortWorkouts(){
    const criterion = inputCriterion.value.toLowerCase();
    const type = inputSortType.value.toLowerCase();
    const fake = this.#workouts.slice();
    if(type === 'descending')
    fake.sort((a,b) => a[criterion]-b[criterion]);else fake.sort((a,b) => b[criterion]-a[criterion]);
    document.querySelectorAll('.workout').forEach(work => {
      work.parentElement.removeChild(work);
    });
    fake.forEach(this._renderingTheList);
  }
}
const app = new App();
