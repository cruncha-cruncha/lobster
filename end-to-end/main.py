import requests
import logging
import json
import jwt
import sys

import shared
import user
import post

# how to test unhappy paths??
# if they were handled by a different test suite?
# or the first time we come across a step type in this suite, we also test the unhappy paths for it?
# or is this a sign that our steps are too large and need to be more granular/specific?

# no, I don't want more granularity: want to be able to define large steps for ease of testing
# but should have a boolean flag or something in this code that globally enables testing of un-happy paths at every step
# this will naturally result in much slower testing, but that's okay, because it's not the default

def parse_file(path):
    with open(path, 'r') as f:
        data = json.load(f)
        if isinstance(data, dict):
            return [data]
        elif isinstance(data, list):
            data.sort(key=lambda x: x['meta']['timing'])
            return data
        else:
            print('Unable to parse file: ' + path)
            return []

def merge_sorted_lists(listA, listB):
    if len(listA) == 0:
        return listB
    if len(listB) == 0:
        return listA

    indexA = 0
    indexB = 0

    while indexA < len(listA) and indexB < len(listB):
        if listA[indexA]['meta']['timing'] < listB[indexB]['meta']['timing']:
            indexA += 1
        else:
            listA.insert(indexA, listB[indexB])
            indexA += 1
            indexB += 1

    if indexB < len(listB):
        listA.extend(listB[indexB:])
    
    return listA

def handle_step(source, super_user):
    logging.debug(source['meta']['type'] + ' : ' + source['meta']['id'] + ' @ ' + str(source['meta']['timing']))
    success = True

    if source['meta']['type'] == 'define_user':
        shared.GLOBAL_DATA[source['meta']['id']] = user.User(source)
    elif source['meta']['type'] == 'create_user':
        success = shared.GLOBAL_DATA[source['id']].create(super_user)
    elif source['meta']['type'] == 'login_user':
        success = shared.GLOBAL_DATA[source['id']].login()
    elif source['meta']['type'] == 'hard_delete_user' \
    or source['meta']['type'] == 'hard_delete_post':
        success = shared.GLOBAL_DATA[source['id']].hard_delete(super_user)
    elif source['meta']['type'] == 'define_post':
        shared.GLOBAL_DATA[source['meta']['id']] = post.Post(source)
    elif source['meta']['type'] == 'make_post':
        success = shared.GLOBAL_DATA[source['id']].make()
    elif source['meta']['type'] == 'soft_delete_post':
        success = shared.GLOBAL_DATA[source['id']].soft_delete()
    else:
        print('Unknown step type: ' + step['meta']['type'])   

    return success

def get_super_user():
    data = parse_file('./json/super/user.json')
    return user.User(data[0])

def go():
    super_user = get_super_user()

    paths = [
        './json/alice/user.json',
        './json/alice/post01.json',
        # './json/bob/user.json',
    ]

    all_steps = []
    for path in paths:
        data = parse_file(path)
        all_steps = merge_sorted_lists(all_steps, data)

    for step in all_steps:
        if step['meta']['timing'] < 0:
            continue
        if step['meta']['timing'] > 1.2:
            break
        
        if not handle_step(step, super_user):
            print('failure')
            break

if __name__ == "__main__":
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    go()

