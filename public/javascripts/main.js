
var vm = new Vue({
	el: "#burn",
	data: {
		loggedIn: false,
		addingGoal: false,
		addingMessage: "How many words did you write today?",
		addingLinkText: "Add Goal",
		submittedGoal: false,
		submittedCount: false,
		goalMin: "",
		countMin: "",
		countMax: "",
		selectedMonth: "",
		logo: "",
		overlay: false,
		message: "Sign Up",
		showSignup: false,
		editingProfile: false,
		submittedProfile: true,
		active: false,
		signIn: {
			name: "",
			username: "",
			password: ""
		},
		count: {
			words: "",
			date: ""
		},
		goal: {
			words: "",
			date: ""
		},
		profile: {
			name: "",
			genre: "",
			bio: "",
			photo: ""
		},
		userSince: "",
		userCounts: [],
		badges: [],
		UIBadgeAnnouncements: [],
		userPhoto: "",
		stats: {
			allTimeTotal: 0,
			allTimeAverage: 0,
			monthTotal: 0,
			monthAverage: 0,
			goalWordsPerDay: 0,
			allTimeMostProductiveDate: {
				date: "No Data",
				words: 0
			},
			allTimeMostProductiveDay: "No Data",
			monthMostProductiveDate: {
				date: "No Data",
				words: 0
			},
			monthMostProductiveDay: "No Data"
		},
		timeoutId: 0,
		famousPhoto: "",
		famousFeedStaging: [],
		youMayKnow: [],
		friends: [],
		announcements: [],
		today: ""
	},
	methods: {
		//BEGIN Badge Functions
		renderBadges: function(personData){
			this.badges = []
			for (var i=0;i<personData.badges.length; i++){
				this.badges.push(personData.badges[i])
			}
			return personData;
		},
		announceBadge: function(personData){
			var announcement = personData.name + " earned the " + personData.badges[personData.badges.length-1].title + " badge."
			var exists = false
			for(var i=0; i<this.UIBadgeAnnouncements.length; i++){
				if (this.UIBadgeAnnouncements[i] === announcement) {
					exists = true
				}
			}
			for(var j=0;j<this.announcements.length; j++){
				if(this.announcements[j].text === announcement) {
					exists = true
				}
			}
			if (exists){
				return false
			} else {
				var identification = this.announcements.length
				this.announcements.unshift({
					text: announcement,
					id: identification
				})	
			}
		},
		//END Badge Functions
		//BEGIN Count Functions
		submitCount: function(data, event){
			event.preventDefault()
			var formData = {
				words: parseInt(data.words),
				date: new Date(data.date)
			}
			$.ajax({
				url: "/addcount",
				type: "POST",
				data: formData,
				success: (data)=>{
					if(data==="Please log in"){
						this.overlay = true
					} else {
						this.userCounts = data.counts
						var temp = new Date()
						var currentMonth = temp.getMonth()
						this.runAllTimeCalcs(this.userCounts)
						this.runMonthCalcs(this.userCounts, currentMonth)
						//announce new entry in feed
						var announcement = this.profile.name + " wrote " + formData.words + " words."
						var identification = this.announcements.length
						this.announcements.unshift({
							text: announcement,
							id: identification
						})
						this.count.words = ""
						this.count.date = ""
						this.submittedCount = true
						this.submittedGoal = false
						if(data.badges !== this.badges){
							this.announceBadge(this.renderBadges(data))
						}
											
					}

				}
			})
		},
		selectMonth: function(){
			this.runMonthCalcs(this.userCounts, this.selectedMonth)
		},
		runAllTimeCalcs: function(data){
			if(data === "please log in") {
				this.allTimeTotal = "please log in"
			} else if(data.length)  {
				
				this.sortByDate(data)
				
				//DB returns date string with timestamp included but set to 00:00:00:000z
				var productive = this.findProductiveDate(data)
				var prodDate = new Date(productive.date)
				//correct date, finally
				var tempDate = prodDate.getUTCDate()
				var tempMonth = prodDate.getUTCMonth()
				var tempYear = prodDate.getUTCFullYear()
				var newDate = new Date(tempYear, tempMonth, tempDate)
				this.stats.allTimeMostProductiveDate = {
					date: newDate.toLocaleDateString(),
					words: productive.words
				}
				this.stats.allTimeTotal = this.calcTotal(data)		
				this.stats.allTimeMostProductiveDay = this.findProductiveDay(data)
				this.stats.allTimeAverage = this.calcAverageAllTime(data)
				$.ajax({
					url: "/recordtotal",
					type: "POST",
					data: this.stats,
					success: (data)=>{
						// console.log(data, data.total)
					}
				})
			}
			else {
				// this.stats.allTimeTotal	=	"No Data"
				// this.stats.allTimeAverage = "No Data"
				// this.stats.allTimeMostProductiveDay = "No Data"
				// this.stats.allTimeMostProductiveDate.date = "No Data"
				// this.stats.allTimeMostProductiveDate.words = ""			
			}
		},
		runMonthCalcs: function(data, month) {
			var monthlyData = this.selectByMonth(data, month)
			if (monthlyData.length){
				this.stats.monthTotal	=	this.calcTotal(monthlyData)
				this.stats.monthAverage = this.calcAverageMonth(monthlyData)
				this.stats.monthMostProductiveDay = this.findProductiveDay(monthlyData)
				var productive = this.findProductiveDate(monthlyData)
				var prodDate = new Date(productive.date)
				//corrected date
				var tempDate = prodDate.getUTCDate()
				var tempMonth = prodDate.getUTCMonth()
				var tempYear = prodDate.getUTCFullYear()
				var newDate = new Date(tempYear, tempMonth, tempDate)
				this.stats.monthMostProductiveDate = {
					date: newDate.toLocaleDateString(),
					words: productive.words
				}				
			}
			else {
				this.stats.monthTotal	=	0
				this.stats.monthAverage = 0
				this.stats.monthMostProductiveDay = "No Data"
				this.stats.monthMostProductiveDate.date = "No Data"
				this.stats.monthMostProductiveDate.words = 0
			}

		},
		//if submit count before login, error message:
		//"reduce of empty array with no initial value"
		calcTotal: function(data){
			//won't need this check if don't show count form before login
			//...but might want to show count form before login
			//in which case needs to account for array AND error string
			if (data.length) {
				return data.map(function(a){
					return a.words
				}).reduce(function(a,b){
					return a+b
				})
			} else {
				return null
			}
		},
		//helper function to sort counts
		sortByDate: function(data){
			if(data.length){
				return data.sort(function(a,b){
					return new Date(a.date).getTime() - new Date(b.date).getTime()
				})				
			}
			else {
				// console.log("sortByDate() parameter is empty")
			}
		},
		selectByMonth: function(data, month){
			return data.filter(function(item){
				return new Date(item.date).getMonth() === month
			})
		},
		//returns object containing date and numwords
		findProductiveDate: function(filteredArray){
			if(filteredArray.length) {
				return filteredArray.reduce(function(a,b){
					return (b.words > a.words) ? b : a;
				})					
			}
			else {
				return "No dates found"
			}
		},
		findProductiveDay: function(data){
			var days = [0,0,0,0,0,0,0]
			var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
			for(var i=0; i<data.length;i++){
				var dayOfWeek;
				if(new Date(data[i].date).getDay() === 6){
					dayOfWeek = 0
				} else {
					dayOfWeek = new Date(data[i].date).getDay()+1
				}
				//sort by day of week and keep running total for each day of week
				days[dayOfWeek] += data[i].words
			}
			//compare totals of each day of week and find highest
			var highestCount = days.reduce(function(a,b){
				return Math.max(a,b)
			})
			var highestIndex = days.indexOf(highestCount)
			var productiveDay = dayNames[highestIndex]
			return productiveDay
		},
		daysInMonth: function(month, year){
			return new Date(year, month, 0).getDate()
		},
	//calcAverageMonth calculates entire month, but more pressingly need
	//month up until today for current month only
		calcAverageMonth: function(filteredOrUnfilteredArray){
			if(filteredOrUnfilteredArray.length) {
				var total = this.calcTotal(filteredOrUnfilteredArray)
				//figure out which month the array is for
				var tempdate = filteredOrUnfilteredArray[0].date
				var date = new Date(tempdate)
				var year = date.getFullYear()
				var month = date.getMonth()
				var today = new Date()
				var firstOfMonth = new Date(year, month)
				var signUpDate = new Date(this.userSince)
				var days;
				//if calculating current month that isn't finished,
				//calculate average for month SO FAR
				if(today.getFullYear() === year && today.getMonth() === month){
					days = today.getDate()
				} else {
					days = this.daysInMonth((month + 1), year)
				}
				//if signed up in month we're calculating, only
				//calculate average since signed up
				if(signUpDate > firstOfMonth) {
					days = this.diffDates(signUpDate, today)
				}
				if(days === 0) {
					return total
				}				
				else {
					return (total / days).toFixed(0) //returns String	
				}
			}
			else {
				return 0
			}
		},
		diffDates: function(a,b){
			var msPerDay = 1000*60*60*24
			var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
			var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
			return Math.floor((utc2 - utc1) / msPerDay)
		},
//Average since your first entry, up to today
		calcAverageAllTime: function(data){
			var firstday = new Date(data[0].date)
			var today = new Date()
			var daysBetween = this.diffDates(firstday, today)
			var total = this.calcTotal(data)
			if(daysBetween === 0){
				//account for identical values for
				//zero days between and one actual day between
				daysBetween = 1
			}
			return (total / daysBetween).toFixed(0)
		},
		//END Count Functions
		//BEGIN Goal Functions
		submitGoal: function(data, event){
			event.preventDefault()
			var formData = {
				words: parseInt(data.words),
				date: new Date(data.date)
			}
			$.ajax({
				url: "/setgoal",
				type: "POST",
				data: formData,
				success: (data)=>{
					this.stats.goalWordsPerDay = this.calcWpdToGoal(data.goal)
					this.goal.words = ""
					this.goal.date = ""
					this.submittedGoal = true
					this.submittedCount = false
					if(data.badges !== this.badges){
						this.announceBadge(this.renderBadges(data))
					}
				}
			})
		},
		calcWpdToGoal: function(data){
			var today = new Date()
			var goalDate = new Date(data.date)
			var daysBetween = this.diffDates(today, goalDate) + 1
			var goalAmount = data.words
			return ( goalAmount / daysBetween).toFixed(0)
		},
		showGoalForm: function(event){
			event.preventDefault()
			this.addingGoal = true
			this.addingLinkText = "Add Count"
			this.addingMessage = "How many words do you wish to write by [enter date]?"
			var today = new Date()
			var yyyy = today.getFullYear()
			var mm = ("0" + (today.getMonth()+1)).slice(-2)
			var ddTom = ("0" + (today.getDate()+1)).slice(-2)
			var limitTomorrow = yyyy + '-' + mm + '-' + ddTom
			this.goalMin = limitTomorrow		
		},
		showCountForm: function(event){
			if(event) {
				event.preventDefault()
			}
			this.addingGoal = false
			this.addingLinkText = "Add Goal"
			this.addingMessage = "How many words did you write today?"
			var countDay = new Date()
			var dd = ("0" + countDay.getDate()).slice(-2)
			var mm = ("0" + (countDay.getMonth()+1)).slice(-2)
			var yyyy = countDay.getFullYear()
			var limitToday = yyyy + '-' + mm + '-' + dd
			this.countMax = limitToday
			if(this.userSince){
				var signUpDate = new Date(this.userSince)
				var ddSu = ("0" + signUpDate.getDate()).slice(-2)
				var mmSu = ("0" + (signUpDate.getMonth()+1)).slice(-2)
				var yyyySu = signUpDate.getFullYear()
				var limitSignUp = yyyySu + '-' + mmSu + '-' + ddSu
				this.countMin = limitSignUp
			}
		},
		//END Goal Functions
		//BEGIN Profile Functions
		submitProfile: function(profile, event){
			event.preventDefault()
			$.ajax({
				url: "/createprofile",
				type: "POST",
				data: new FormData($("#profileForm")[0]),
				enctype: 'multipart/form-data',
				cache: false,
				contentType: false,
				processData: false,
				success: (data)=>{
					this.renderPhoto(data)
				}
			})
			this.editingProfile = false
			this.submittedProfile = true
		},
		renderPhoto: function(data){
			if(data.photo){
				this.userPhoto = data.photo
			}
		},
		editProfile: function(event){
			event.preventDefault()
			this.submittedProfile = false
			this.editingProfile = true
		},
		closeProfileForm: function(event){
			event.preventDefault()
			this.editingProfile = false
			this.submittedProfile = true
		},
		//END Profile Functions
		//BEGIN Login/Signup Functions
		signUp: function(data, event){
			event.preventDefault()
			var self = this
			$.post('/signup', data, function(successData){
				//if user already exists, need to redirect to login
				if(successData === "<h1>User already exists; please log in.</h1>"){
					self.toggleForm()
					self.signIn.password = ""
				} else {
					self.profile = {
						name: self.signIn.name,
						genre: "",
						bio: "",
						photo: ""
					},
					self.userPhoto = successData.photo
					self.userSince = successData.created
					self.signIn = {
						name: "",
						username: "",
						password: ""
					}
					this.loggedIn = true
					self.overlay = false
					self.announceBadge(self.renderBadges(successData))
					self.runAllTimeCalcs(successData.counts)
					// self.runMonthCalcs(successData.counts, 2)
					self.showCountForm()
				}
				
				self.youMayKnow = []
				self.getStrangersOnly()
			})
		},
		logIn: function(data, event){
			event.preventDefault()
			var self = this
			$.post('/login', data, function(successData){
				if(successData === "Failed to log in"){
					self.toggleForm()
				} else {
					this.loggedIn = true
					var temp = new Date()
					var currentMonth = temp.getMonth()
					self.userCounts = successData.counts
					self.userPhoto = successData.photo
					self.userSince = successData.created
					self.youMayKnow = []
					// if(self.userCounts.length){
						self.runAllTimeCalcs(self.userCounts)
						self.runMonthCalcs(self.userCounts, currentMonth)	
					// }
					self.renderUser(successData)
					self.renderPhoto(successData)
					self.showProfile = true
					self.getStrangersOnly()	
					self.overlay = false
					self.renderBadges(successData)	
					for(var i=0;i<successData.badgeAnnouncements.length; i++){
						self.UIBadgeAnnouncements.push(successData.badgeAnnouncements[i])
					}
					self.showCountForm()	
				}
			})
			this.signIn = {
				name: "",
				username: "",
				password: ""
			}

		},
		//don't need this; wrote "/logout" into a tag href in html
		// logOut: function(event){
		// 	event.preventDefault()
		// 	window.location.href="/logout"
		// },
		shuffle: function(array){
			for(var i = array.length-1; i>0; i-- ){
				var j = Math.floor(Math.random() * (i+1))
				var temp = array[i]
				array[i] = array[j]
				array[j] = temp
			}
		},
		renderUser: function(data){
			this.profile.name = data.name
			this.profile.genre = data.genre
			this.profile.bio = data.bio
			this.shuffle(data.friends)
			for(var i=0; i<data.friends.length; i++){
				this.friends.push(data.friends[i])
			}
		},
		showOverlay: function(event){
			// event.preventDefault()
			this.overlay = true
		},
		doNothing: function(){

		},
		hideOverlay: function(event){
			event.preventDefault()
			this.overlay = false
		},
		toggleForm: function(){
			if(this.showSignup === false){
				this.message = "Log In"
				this.showSignup = true
			} else if (this.showSignup === true ){
				this.message = "Sign Up"
				this.showSignup = false
			}
		},
		//END Login/Signup Functions
		//BEGIN Friend Functions
		//removes user's own profile plus all friend profiles
		getStrangersOnly: function(){
			$.ajax({
				url: "/getstrangers",
				type: "GET",
				success: (data)=>{
					this.renderYouMayKnow(data)
				}
			})
		},
		renderYouMayKnow: function(data){
			this.shuffle(data)
			for(var i=0; i<data.length; i++){
				this.youMayKnow.push({
					name: data[i].name,
					genre: data[i].genre,
					bio: data[i].bio,
					photo: data[i].photo,
					id: data[i]._id
				})
			}
		},
		hover:function(item, v){
			item.hovered = v
		},
		addFriend: function(person, event){
			event.preventDefault()
			var id = {newFriendId: person.id}
			$.ajax({
				url: "/addfriend",
				type: "POST",
				data: id,
				success: (data)=>{
					var announcement = data.user.name + " is following " + data.newFriend + "."
					var identification = this.announcements.length
					this.announcements.unshift({
						text: announcement,
						id: identification
					})
					for(var i=0; i<this.youMayKnow.length; i++) {
						if(this.youMayKnow[i].name === data.newFriend){
							this.youMayKnow.splice(i, 1)
						}
					}
					this.friends = data.user.friends
					for(var i=0;i<this.friends.length;i++){
						this.friends[i].hovered = false
					}				
					if(data.user.badges !== this.badges){
						this.announceBadge(this.renderBadges(data.user))
					}
					
				}
			})
		},
		renderLogo: function(){
			var logoArray = ["b","u","r","n"," ","o","n","e"," ","m","i","l","l","i","o","n"]
			//at interval, remove index 0 from array and add to this.logo string
			var typedLogo = setInterval(()=>{
				var item = logoArray.shift()
				this.logo = this.logo + item
				if(logoArray.length===0){
					clearInterval(typedLogo)
				}
			},250)
		},
		getFamous: function(){
			$.ajax({
				url: "/getfamous",
				type: "GET",
				success: (data)=>{
					this.renderYouMayKnow(data)
					if(this.loggedIn === false){
						this.renderRandom(this.generateRandom(data))
					}
				}
			})
		},
		generateRandom: function(array){
			return array[Math.floor(Math.random() * array.length)]
		},
		renderRandom: function(random){
			this.profile.name = random.name
			this.profile.genre = random.genre
			this.profile.bio = random.bio
			//assign to diff local variable than profile.photo
			//ruins render of user photo after login/profile submit
			this.famousPhoto = random.photo
			// this.renderPhoto(random)
		},
		randomizeFamousFeed: function(){
			//need to prevent "...wrote 0 words"
			//need to remove item from staging array after adding to render array
			//to prevent repeats (no, bc then feed isn't infinite)
			var famousArray = ["Henry Miller", "Anais Nin", "Truman Capote", "F. Scott Fitzgerald", "Sylvia Plath", "Earnest Hemingway", "Mary Shelley", "Virginia Woolf", "Gertrude Stein", "Jack Kerouac"]
			var badgesArray = ["Hemingway", "Very Productive", "Published Manuscript", "Completed Manuscript", "Conquered Goal", "10 day Streak", "30 day streak", "Social", "Aspiring Author", "Goal Oriented", "NaNoWriMo"]
			for(var i=0;i<5;i++){
				var person = famousArray[Math.floor(Math.random() * famousArray.length)]
				var count = Math.floor(Math.random() * 1000)
				if(count < 30) {
					count = count * 90
				}
				if(count < 300){
					count = count * 10
				}
				var justWrote = person + " wrote " + count + " words."
				this.famousFeedStaging.push(justWrote)
			}
			for(var j=0; j<5; j++){
				var person1 = famousArray[Math.floor(Math.random() * famousArray.length)]
				var person2 = famousArray[Math.floor(Math.random() * famousArray.length)]
				if(person1 !== person2){
					var nowFriends = person1 + " is following " + person2 + "."
					this.famousFeedStaging.push(nowFriends)
				}
			}
			for(var k=0; k<5; k++){
				var badgeperson = famousArray[Math.floor(Math.random() * famousArray.length)]
				var badge = badgesArray[Math.floor(Math.random() * badgesArray.length)]
				var earnedBadge = badgeperson + " earned the " + badge + " badge."
				this.famousFeedStaging.push(earnedBadge)
			}
		},
		appendToDOM: function(){
			var test = this.famousFeedStaging[Math.floor(Math.random() * this.famousFeedStaging.length)]
			var isAlreadyShown = false;
			if(this.announcements.length){
				var whichLength = 0
				if(this.announcements.length <= 5){
					whichLength = this.announcements.length
				}
				else {
					whichLength = 5
				}
				for(var i=0;i<whichLength; i++){
					if(this.announcements[i].text === test) {
						isAlreadyShown = true
					}
				}				
			}
			if(isAlreadyShown === false) {
				this.announcements.unshift({
					text: test,
					id: this.announcements.length
				})				
			}
			//testing only
			// this.timeoutId = setTimeout(this.appendToDOM, ( (Math.random() * 5 ) + 5 ) * 1000)
			this.timeoutId = setTimeout(this.appendToDOM, ( (Math.random() * 14 ) + 6 ) * 2000)
		},
		//should do everything login and signup do
		//move famous renderers to here in "else"
		checkIfLoggedIn: function(){
			$.ajax({
				url: "/isloggedin",
				type: "GET",
				success: (data)=>{
					if(data === "no user"){
						this.getFamous()
					}
					else {
						this.loggedIn = true
						var temp = new Date()
						var currentMonth = temp.getMonth()
						this.userCounts = data.counts
						this.userPhoto = data.photo
						this.userSince = data.created
						this.youMayKnow = []
						this.runAllTimeCalcs(this.userCounts)
						this.runMonthCalcs(this.userCounts, currentMonth)	
						this.renderUser(data)
						this.renderPhoto(data)
						this.showProfile = true
						this.getStrangersOnly()	
						this.overlay = false
						this.renderBadges(data)	
						this.showCountForm()		
					}
				}
			})
		}
	},
	created: function(){
		this.renderLogo()
		this.checkIfLoggedIn()
		//puts feed items into array
		this.randomizeFamousFeed()
		// adds feed items to array at intervals
		this.appendToDOM()
		this.timeoutId = setTimeout(this.appendToDOM, 10000)
	}
})



	











