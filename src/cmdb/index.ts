import { Command } from 'commander';
import init from './init';
import tag from './tag';

export default new Command('cmdb')
  .description('前端CMDB工具')
  .addCommand(init)
  .addCommand(tag);
