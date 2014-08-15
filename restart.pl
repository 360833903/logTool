#!/usr/bin/perl -w
use warnings;
use strict;

`ps -ef | grep logTool| grep -v grep|awk '{print \$2}'|xargs kill`;

`nohup node /home/huangming/search0708/logTool.js >> /home/huangming/gmTool.log &`;
