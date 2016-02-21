import os
import shutil

def compile():
	print('')
	print('Building')
	print('-------------------------')
	print('')

	name = 'picky'
	build_path = 'build'
	dev_path = 'dev'
	debug = True

	if not os.path.exists(dev_path): 
		print('ERROR: Dev folder not found, exiting')
		return

	if not os.path.exists(build_path): 
		print('ERROR: Build folder not found, exiting')
		return

	compile_js(dev_path + '/js/' + 'main.js', 
		build_path + '/js/' + name + '.js', 
		debug)


def read_js(src, out, debug):
	print(src)
	state = 0
	f = open(src, 'r')
	for l in f:
		if l.startswith('//INCLUDE'):
			path = l.split('//INCLUDE ')[1].rstrip('\n')
			read_js(path, out, debug)
		else:
			if state is 0:
				if not debug and l.find('//DEBUG') is not -1: state = 1
				elif not debug and l.find('ASSERT') is not -1: continue
				elif not debug and l.find('LOG') is not -1: continue
				else: out.append(l)
			elif state is 1:
				if l.find('//END') is not -1: read_state = 0
				elif debug is True: out.append(l)

	out.append('\n')
	f.close()


def compile_js(src, dest, debug):
	result = [];
	read_js(src, result, debug)

	js_string = ''
	for line in result: js_string += line

	f = open(dest, 'w')
	f.write(js_string)
	f.close()

	print('')


def main(argv = None):
	compile()

if __name__ == "__main__":
    main()