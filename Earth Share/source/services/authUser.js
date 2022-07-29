const firefox = require('selenium-webdriver/firefox');
const { Builder, By, until } = require('selenium-webdriver');
const getAuth = async (uName, pswd) => {
	try{
		const screen = {
			width: 640,
			height: 480
		};
		var c;
		const driver = await new Builder()
				.forBrowser('firefox')
				//.setFirefoxOptions(new firefox.Options().headless().windowSize(screen))
				.setFirefoxOptions(new firefox.Options().setBinary('C:/Program Files/Mozilla Firefox/firefox.exe'))
				.build();
		await driver.get('https://www.tu-chemnitz.de/informatik/DVS/blocklist/');
		await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div[1]/div[2]/form[1]/button')).click();
		await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div/form/input[1]')).sendKeys(uName);
		await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div/form/input[3]')).click();
	
		if(await driver.getTitle() === 'CAPTCHA for Authentication required - Web Trust Center 3.0'){
			await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div/form/span/label/input')).click();
			await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div/button')).click();

			await driver.wait(until.titleIs('Authentication required - Web Trust Center 3.0'), 10000 , "Timed out")
			.catch(function(e){
				if (e.message.match("Timed out")){
				return e; 
				} else {
				throw e;
				}
			})
			.then(async function(e){
				if (e.message && e.message.match("Timed out")){
					await driver.quit();
					c = "CAPTCHA required";
					return c;
				}
			});
		}
		await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div/form/input[1]')).sendKeys(pswd);
		await driver.findElement(By.xpath('/html/body/div[1]/div/div/div[2]/div/main/div/form/input[2]')).click();
		// console.log(await driver.wait(driver.getTitle(), 10000))
		if(await driver.getTitle() === 'Authentication required - Web Trust Center 3.0'){
			c = "invalid username or password";
		}else{
			await driver.wait(until.titleIs('Blocklist web service'));
			await  driver.manage().getCookie('_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468').then(function (cookie) {
				c = "Shibsession:"+cookie.value;
			  });
		}
		await driver.quit();
		return c;
	} catch (error){
		console.log(error);
	}
}

module.exports = {
	getAuth
}