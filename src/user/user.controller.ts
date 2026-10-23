import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface AuthenticateRequest extends Request {
  user: { sub: number };
}
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.signup(createUserDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticateRequest,
  ) {
    return this.userService.update(id, updateUserDto, req.user.sub);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticateRequest,
  ) {
    return this.userService.remove(id, req.user.sub);
  }
}
