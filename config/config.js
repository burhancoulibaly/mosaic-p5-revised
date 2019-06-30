const _ = require('lodash')



if(process.env.config != null){
    config = JSON.parse(process.env.config);

    const defaultConfig = config;
          environment = process.env.NODE_ENV|| 'development';
          environmentConfig = config[environment];
          finalConfig = _.merge(defaultConfig, environmentConfig);

    // as a best practice
    // all global variables should be referenced via global. syntax
    // and their names should always begin with 

    if(finalConfig != null){
        global.gConfig = finalConfig;
        // console.log(global.gConfig);
    }else{
        console.log("Unable to create config");
    }
}else{
    const config = require("./config.json");
    
    const defaultConfig = config;
          environment = process.env.NODE_ENV|| 'development';
          environmentConfig = config[environment];
          finalConfig = _.merge(defaultConfig, environmentConfig);
    
    //module variables


    // as a best practice
    // all global variables should be referenced via global. syntax
    // and their names should always begin with 

    if(finalConfig != null){
        global.gConfig = finalConfig;
        // console.log(global.gConfig);
    }else{
        console.log("Unable to create config");
    }
}