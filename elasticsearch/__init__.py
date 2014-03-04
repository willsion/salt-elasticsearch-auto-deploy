#coding=utf-8

#from django.conf.settings import logging_file
import logging,os.path

def __init_log_handle():
	files_path = os.path.dirname(
	                        os.path.abspath(os.path.dirname(__file__))
	                    ) + "/"

	logging_file = files_path + "test"

	logger = logging.getLogger("endlesscode")
	formatter = logging.Formatter('%(name)-12s %(asctime)s %(levelname)-8s %(message)s', '%a, %d %b %Y %H:%M:%S',)
	file_handler = logging.FileHandler(logging_file)
	file_handler.setFormatter(formatter)
	logger.addHandler(file_handler)
	return logger


logger = __init_log_handle()