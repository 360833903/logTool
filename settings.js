module.exports = {
	server: {
                simplified: {
                        db: 'operation_db',
                        host: '10.96.36.181',
                        port: 27017
                },
                simplifiedLog: {
                        db: 'operation_db',
                        host: '10.96.36.181',
                        port: 27017
                },	
		traditional: {
			db: 'operation_db',
			host: '54.238.138.78',
			port: 27017
		},

                traditionalLog: {
                        db: 'operation_log',
                        host: '54.238.138.78',
                        port: 27017
                },
                simplified_backup: {
						db: 'operation_log',
                        host: '10.96.36.40',
                        port: 27017
                },

                traditional_backup: {
                        db: 'operation_log',
                        host: '54.238.138.78',
                        port: 27017
                },

                simplified_game_slave: {
                        db: 'game_db',
                        host: '10.96.36.64',
                        port: 27017
                },
				simplified_game_slave2: {
                        db: 'game_db',
                        host: '10.96.36.168',
                        port: 27017
                },
                simplified_game_slave3: {
                        db: 'game_db',
                        host: '10.96.36.240',
                        port: 27017
                },
                simplified_game_slave4: {
                        db: 'game_db',
                        host: '10.96.36.16',
                        port: 27017
                },
	
                simplified_game_master: {
                        db: 'game_achievement_db',
                        host: '10.96.36.169',
                        port: 27017
                },
		        simplified_game_master2: {
                        db: 'game_achievement_db',
                        host: '10.96.36.167',
                        port: 27017
                },
                simplified_game_master3: {
                        db: 'game_achievement_db',
                        host: '10.96.36.12',
                        port: 27017
                },
                simplified_game_master4: {
                        db: 'game_achievement_db',
                        host: '10.96.36.14',
                        port: 27017
                },

	},			
	useseconds: [121, 122, 145]
};
